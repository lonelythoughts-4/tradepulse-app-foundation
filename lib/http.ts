import { NextResponse, type NextRequest } from 'next/server'
import { resolveUser, readEnvironment, type AuthedUser, type Environment } from './auth'

export type Ctx = { user: AuthedUser; environment: Environment; req: NextRequest }

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

/** Wrap a handler with authentication; 401 when the caller cannot be resolved. */
export function withUser(handler: (ctx: Ctx) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    let user: AuthedUser | null
    try {
      user = await resolveUser(req)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.'
      return fail(message, 500)
    }
    if (!user) return fail('Your session has expired. Please reopen from Telegram.', 401)
    try {
      return await handler({ user, environment: readEnvironment(req), req })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      return fail(message, 500)
    }
  }
}

/** Same as withUser, but rejects non-admins with 403. */
export function withAdmin(handler: (ctx: Ctx) => Promise<NextResponse>) {
  return withUser(async (ctx) => {
    if (!ctx.user.is_admin) return fail('Admin access required.', 403)
    return handler(ctx)
  })
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    return {} as T
  }
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}
