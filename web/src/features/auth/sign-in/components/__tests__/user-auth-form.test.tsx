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
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useStatus } from '@/hooks/use-status'

import type { SystemStatus } from '@/features/auth/types'

import { UserAuthForm } from '../user-auth-form'

vi.mock('@/hooks/use-status', () => ({
  useStatus: vi.fn(),
}))

vi.mock('@/features/auth/hooks/use-auth-redirect', () => ({
  useAuthRedirect: () => ({
    handleLoginResult: vi.fn(async () => true),
  }),
}))

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
    handleCustomOAuthLogin: vi.fn(),
  }),
}))

const statusWithSsoAndPassword = {
  oidc_enabled: true,
  password_login_enabled: true,
} as unknown as SystemStatus

const statusWithSsoOnly = {
  oidc_enabled: true,
  password_login_enabled: false,
} as unknown as SystemStatus

function mockStatus(status: SystemStatus | null) {
  vi.mocked(useStatus).mockReturnValue({
    status,
    loading: false,
    error: null,
  })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UserAuthForm SSO-only mode', () => {
  it('hides the password form by default and shows SSO providers', () => {
    mockStatus(statusWithSsoAndPassword)
    render(<UserAuthForm />)

    expect(
      screen.queryByLabelText('Username or Email')
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Continue with OIDC' })
    ).toBeVisible()
    // No password form means the "Or continue with" divider is noise.
    expect(screen.queryByText('Or continue with')).not.toBeInTheDocument()
  })

  it('shows the password form alongside SSO when adminLogin is set', () => {
    mockStatus(statusWithSsoAndPassword)
    render(<UserAuthForm adminLogin />)

    expect(
      screen.getByLabelText('Username or Email')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Continue with OIDC' })
    ).toBeVisible()
    expect(screen.getByText('Or continue with')).toBeInTheDocument()
  })

  it('keeps the password form hidden when the server disables password login even with adminLogin', () => {
    mockStatus(statusWithSsoOnly)
    render(<UserAuthForm adminLogin />)

    expect(
      screen.queryByLabelText('Username or Email')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Continue with OIDC' })
    ).toBeVisible()
  })
})
