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
import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignUp } from '@/features/auth/sign-up'
import { statusQueryOptions } from '@/lib/status-query'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/(auth)/sign-up')({
  component: SignUp,
  beforeLoad: async ({ context }) => {
    const { auth } = useAuthStore.getState()

    // 如果已经有用户信息，说明已登录，注册页对其无意义，跳转到 dashboard
    if (auth.user) {
      throw redirect({ to: '/dashboard' })
    }

    // 后端关闭注册时（controller/user.go 的 RegisterEnabled 校验），
    // 注册页不应再渲染。读取共享的 /api/status 缓存，失败时放行，
    // 由注册接口在服务端兜底。
    let status: Record<string, unknown> | null = null
    try {
      status = await context.queryClient.fetchQuery(statusQueryOptions)
    } catch {
      // Fail open: the register API still enforces the gate server-side.
    }
    if (status?.register_enabled === false) {
      throw redirect({ to: '/sign-in' })
    }
  },
})
