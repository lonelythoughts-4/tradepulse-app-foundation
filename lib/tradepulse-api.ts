export type ApiError = Error & { status: number; details?: unknown }

const apiBaseUrl = '/api'

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
  const telegramInitData = typeof window !== 'undefined'
    ? (globalThis as typeof globalThis & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? ''
    : ''
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': telegramInitData,
      'X-TradePulse-Environment': 'mainnet',
      ...init.headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.assign('/')
    }
    const message = typeof body?.message === 'string' ? body.message : `TradePulse API request failed (${response.status})`
    throw new TradepulseApiError(message, response.status, body)
  }

  return body as T
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const tradepulseApi = {
  dashboard: () => request('/v1/dashboard'),
  acceptOnboarding: () => post('/v1/onboarding/accept', {}),
  startDemo: () => post('/v1/demo/start', {}),
  createBot: (body: { product: 'memecoin' | 'synthetic'; amount: number }) => post('/v1/bots', body),
  botAction: (botId: string, body: { action: 'toggle' | 'close' | 'compound'; percent?: 0 | 50 | 100 }) => post(`/v1/bots/${encodeURIComponent(botId)}/actions`, body),
  createDeposit: (body: { asset: string; chain: string; expected_amount?: number | null }) => post('/v1/deposits/routes', body),
  confirmDepositSent: (intentId: string) => post(`/v1/deposits/${encodeURIComponent(intentId)}/watch`, {}),
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
  synthetic: (market: 'SYN-25' | 'SYN-50') => request(`/v1/synthetic/${market}`),
  syntheticAction: (body: { action: 'open' | 'close' | 'reset'; market?: 'SYN-25' | 'SYN-50'; direction?: 'long' | 'short'; amount?: number; position_id?: string }) => post('/v1/synthetic/actions', body),
  adminOverview: () => request('/v1/admin/overview'),
  addAdmin: (user_id: number) => post('/v1/admin/members', { user_id }),
  fundAccount: (body: { user_id: number; amount: number; reason: string }) => post('/v1/admin/fund', body),
  resetUserOnboarding: (user_id: number) => post('/v1/admin/onboarding/reset', { user_id }),
  reissueDemo: (user_id?: number) => post('/v1/admin/demo/reissue', user_id === undefined ? {} : { user_id }),
  switchEnvironment: (environment: 'mainnet' | 'testnet') => post('/v1/admin/environment', { environment }),
  updateAdminSetting: (key: string, value: unknown) => post('/v1/admin/settings', { key, value }),
  vaults: () => request('/v1/admin/vaults'),
  saveVault: (body: { chain: string; asset: string; address: string }) => post('/v1/admin/vaults', body),
  toggleSweeps: () => post('/v1/admin/sweeps/toggle', {}),
  sweepAction: (intentId: string, action: 'retry' | 'manual' | 'quarantine') => post(`/v1/admin/sweeps/${encodeURIComponent(intentId)}`, { action }),
  withdrawalDecision: (withdrawalId: string, action: 'approve' | 'reject') => post(`/v1/admin/withdrawals/${encodeURIComponent(withdrawalId)}`, { action }),
  recoveryDecision: (caseId: string, status: 'verified' | 'rejected' | 'treasury_review') => post(`/v1/admin/recovery/${encodeURIComponent(caseId)}`, { status }),
  broadcast: (body: { scope: 'all' | 'user' | 'channel' | 'group'; target?: string; message: string; confirmation?: 'SEND ALL' }) => post('/v1/admin/broadcast', body),
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
