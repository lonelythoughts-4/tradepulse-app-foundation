export type ApiError = Error & { status: number; details?: unknown }

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')

export class TradepulseApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'TradepulseApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new TradepulseApiError('TradePulse API is not configured yet.', 503)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : `TradePulse API request failed (${response.status})`
    throw new TradepulseApiError(message, response.status, body)
  }

  return body as T
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const tradepulseApi = {
  dashboard: () => request('/v1/dashboard'),
  createDeposit: (body: { asset: string; chain: string; expected_amount?: number }) => post('/v1/deposits', body),
  watchDeposit: (intentId: string) => post(`/v1/deposits/${intentId}/watch`, {}),
  createWithdrawal: (body: { asset: string; chain: string; address: string; amount: number; security_code: string }) => post('/v1/withdrawals', body),
  tankAction: (body: { action: 'topup' | 'autofill'; amount?: number }) => post('/v1/tank/actions', body),
  alerts: () => request('/v1/alerts'),
  createAlert: (body: { asset: string; operator: 'above' | 'below'; threshold: number }) => post('/v1/alerts', body),
  removeAlert: (alertId: string) => post(`/v1/alerts/${alertId}/remove`, {}),
  memecoinChart: (asset: 'BTC' | 'ETH' | 'SOL') => request(`/v1/charts/memecoin?asset=${asset}`),
  syntheticChart: (market: 'SYN-25' | 'SYN-50') => request(`/v1/charts/synthetic?market=${market}`),
  notifications: () => request('/v1/account/notifications'),
  toggleNotification: (name: string) => post('/v1/account/notifications', { name }),
  whitelist: () => request('/v1/account/whitelist'),
  addWhitelist: (body: { chain: string; nickname: string; address: string }) => post('/v1/account/whitelist', body),
  resetAccount: () => post('/v1/account/reset', {}),
  setSecurityCode: (code: string) => post('/v1/account/security-code', { code }),
  createSupportTicket: (body: { topic: string; message: string }) => post('/v1/support/tickets', body),
  submitRecovery: (body: { network: string; asset: string; tx_hash: string; destination: string; details: string }) => post('/v1/recovery', body),
  adminOverview: () => request('/v1/admin/overview'),
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof TradepulseApiError) {
    if (error.status === 401) return 'Your Telegram session has expired. Please sign in again.'
    if (error.status === 403) return 'You do not have permission to perform this action.'
    if (error.status === 404) return 'This item is no longer available. Refresh and try again.'
    if (error.status === 409) return 'This action conflicts with the latest account state. Refresh and try again.'
    if (error.status === 428) return 'Complete the required account setup before continuing.'
    if (error.status === 503) return 'The TradePulse service is unavailable right now.'
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
