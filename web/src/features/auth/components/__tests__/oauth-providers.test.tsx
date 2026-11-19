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
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SystemStatus } from '@/features/auth/types'

import { OAuthProviders } from '../oauth-providers'

const handleCustomOAuthLogin = vi.fn()

vi.mock('@/features/auth/hooks/use-oauth-login', () => ({
  useOAuthLogin: () => ({
    isLoading: false,
    githubButtonText: '',
    githubButtonDisabled: false,
    handleGitHubLogin: vi.fn(),
    handleDiscordLogin: vi.fn(),
    handleOIDCLogin: vi.fn(),
    handleLinuxDOLogin: vi.fn(),
    handleTelegramLogin: vi.fn(),
    handleCustomOAuthLogin,
  }),
}))

const customProvider = {
  id: 1,
  name: 'YNU IDS',
  slug: 'ynu-ids',
  icon: 'github',
  client_id: '1523634796438511616',
  authorization_endpoint: 'https://ids.ynu.edu.cn/authserver/oidc/authorize',
  scopes: 'user:email',
}

const statusWithProvider = {
  oidc_enabled: true,
  custom_oauth_providers: [customProvider],
} as unknown as SystemStatus

function renderProviders(
  props: Partial<Parameters<typeof OAuthProviders>[0]> = {}
) {
  return render(
    <OAuthProviders status={statusWithProvider} {...props} />
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

describe('OAuthProviders SSO auto-start', () => {
  it('starts the named custom provider automatically on mount', () => {
    renderProviders({ autoStartSlug: 'ynu-ids' })

    expect(handleCustomOAuthLogin).toHaveBeenCalledTimes(1)
    expect(handleCustomOAuthLogin).toHaveBeenCalledWith(customProvider)
  })

  it('does not auto-start again when the IdP returns to sign-in in the same tab', () => {
    window.sessionStorage.setItem('sso_auto_start_attempted', '1')
    renderProviders({ autoStartSlug: 'ynu-ids' })

    expect(handleCustomOAuthLogin).not.toHaveBeenCalled()
  })

  it('does not auto-start an unknown slug', () => {
    renderProviders({ autoStartSlug: 'other-idp' })

    expect(handleCustomOAuthLogin).not.toHaveBeenCalled()
    // An unknown slug must not consume the one-shot marker.
    expect(
      window.sessionStorage.getItem('sso_auto_start_attempted')
    ).toBeNull()
  })

  it('does not auto-start without a slug', () => {
    renderProviders()

    expect(handleCustomOAuthLogin).not.toHaveBeenCalled()
  })

  it('waits for status and does not consume the marker while it is loading', () => {
    const view = render(
      <OAuthProviders status={null} autoStartSlug='ynu-ids' />
    )
    expect(handleCustomOAuthLogin).not.toHaveBeenCalled()

    view.rerender(
      <OAuthProviders status={statusWithProvider} autoStartSlug='ynu-ids' />
    )

    expect(handleCustomOAuthLogin).toHaveBeenCalledTimes(1)
  })
})
