/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { Route as SignUpRoute } from '@/routes/(auth)/sign-up'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Guards the `/sign-up` route against the backend "Registration
 * Enabled" switch: when the server reports `register_enabled: false`,
 * the page must redirect instead of rendering a dead form.
 */

type ApiMethod = (url: string) => Promise<{ data: unknown }>
type MockableApi = { get: ApiMethod }

const apiClient = api as unknown as MockableApi
const originalGet = apiClient.get

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.getState().auth.reset()
})

afterEach(() => {
  apiClient.get = originalGet
  window.localStorage.clear()
  vi.restoreAllMocks()
})

type StatusPayload = Record<string, unknown>

function stubStatusEndpoint(payload: StatusPayload | Error): void {
  apiClient.get = async (url) => {
    if (url !== '/api/status') throw new Error(`Unexpected GET ${url}`)
    if (payload instanceof Error) throw payload
    return { data: { success: true, data: payload } }
  }
}

type SignUpBeforeLoad = (ctx: { context: unknown }) => Promise<void>

function createRouterAt(path: string) {
  const root = createRootRoute()
  const signUp = createRoute({
    getParentRoute: () => root,
    path: '/sign-up',
    beforeLoad: SignUpRoute.options.beforeLoad as SignUpBeforeLoad,
    component: () => null,
  })
  const signIn = createRoute({
    getParentRoute: () => root,
    path: '/sign-in',
    component: () => null,
  })
  const dashboard = createRoute({
    getParentRoute: () => root,
    path: '/dashboard',
    component: () => null,
  })
  return createRouter({
    routeTree: root.addChildren([signUp, signIn, dashboard]),
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient: new QueryClient() },
  })
}

describe('/sign-up registration gate', () => {
  it('redirects to /sign-in when registration is disabled', async () => {
    stubStatusEndpoint({ register_enabled: false })
    const router = createRouterAt('/sign-up')

    await router.load()

    expect(router.state.location.pathname).toBe('/sign-in')
  })

  it('renders the sign-up page when registration is enabled', async () => {
    stubStatusEndpoint({ register_enabled: true })
    const router = createRouterAt('/sign-up')

    await router.load()

    expect(router.state.location.pathname).toBe('/sign-up')
  })

  it('renders the sign-up page when the status request fails', async () => {
    stubStatusEndpoint(new Error('status unavailable'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const router = createRouterAt('/sign-up')

    await router.load()

    expect(router.state.location.pathname).toBe('/sign-up')
    expect(warn).not.toHaveBeenCalled()
  })
})
