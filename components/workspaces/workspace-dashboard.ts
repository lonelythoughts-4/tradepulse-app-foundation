import type { AvatarId } from "./shared-ui";

export type WorkspaceDashboard = {
  user: {
    id: number;
    first_name?: string;
    username?: string;
    tier: string;
    fee_credit_usd: number;
    avatar_id?: AvatarId | null;
    identity?: { locked_at?: number | null; reveal?: string | null; change_count?: number; change_fee_usd?: number };
    security_code_set?: boolean;
    is_admin: boolean;
    onboarding_complete: boolean;
    onboarding?: { step: number; terms_accepted_at?: number | null; channel: { enabled: boolean; configured: boolean; url: string; verified: boolean; verified_at?: number | null } };
  };
  environment: string;
  wallet: {
    available: number;
    locked: number;
    equity: number;
    hwm: number;
    tank: number;
    tank_capacity: number;
    tank_autofill: boolean;
  };
  bots: Array<{
    id: string;
    name: string;
    product: string;
    state: string;
    capital_usd: number;
    compound_percent: number;
    demo_trial?: number;
    demo_credit_only?: boolean;
    environment?: string;
  }>;
  deposits: Array<{
    id: string;
    asset: string;
    chain: string;
    address: string;
    status: string;
    watch_enabled?: boolean;
    expected_amount?: string;
  }>;
  withdrawals: Array<{
    id: string;
    asset: string;
    chain: string;
    address: string;
    amount_usd: number;
    status: string;
  }>;
  recovery_cases: Array<{
    id: string;
    network: string;
    asset: string;
    status: string;
    updated_at: number;
  }>;
  ledger: Array<{
    id?: number;
    kind: string;
    asset: string;
    amount_usd: number;
    status: string;
    created_at: number;
    trade_detail?: unknown;
  }>;
  engine: Array<{ bot_id?: number; event_key?: string; net_realized: number; status: string; created_at: number }>;
  alerts: Array<{
    id: number;
    asset: string;
    operator: string;
    threshold: number;
  }>;
  notifications: Record<string, boolean>;
  whitelist: Array<{
    id: number;
    chain: string;
    address: string;
    nickname: string;
    cooling_until: number;
  }>;
  demo: {
    state?: string;
    grant_usd?: number;
    expires_at?: number;
    profit_snapshot_usd?: number;
    gift_credit_usd?: number;
    converted_at?: number;
    pool_state?: string;
    pool_available_usd?: number;
    pool_locked_usd?: number;
    pool_realised_pnl_usd?: number;
    credit_available_usd?: number;
    credit_locked_usd?: number;
    credit_active?: boolean;
  } | null;
  popup_ttl_seconds: number;
  notices: Array<{ id: string; kind: string; title: string; body: string }>;
  referral: { count: number; accrued_usd: number; bot_username: string };
  tier_config: Array<{ name: string; rate: number }>;
  referral_rates: number[];
  community_url: string;
  server_time?: number;
  quotes: Record<string, number>;
  quote_age: number;
  quote_fresh: boolean;
  analyst?: { configured?: boolean; model?: string | null };
  memecoin?: {
    authorization?: { accepted_at?: number; settings_json?: string } | null;
    demo_authorization?: { accepted_at?: number; settings_json?: string } | null;
    health?: { status?: string; assets?: number; latest_tick_at?: number | null };
    metrics?: { capacity_usd?: number; reserved_capacity_usd?: number; remaining_capacity_usd?: number; enabled?: boolean; paused?: boolean; close_only?: boolean };
    market_labels?: Record<string, string>;
    recent_settlements?: Array<{ id?: string; bot_id?: number; symbol?: string; direction?: string; realized_pnl?: number; close_reason?: string; closed_at?: number }>;
  };
  synthetic?: {
    execution_mode?: "MANUAL" | "AUTO";
    open_positions?: Array<{ id?: string; market?: string; mode?: string; direction?: string; margin_usd?: number; entry_price?: number; stop_price?: number; take_price?: number; contract_expires_at?: number }>;
    realized_pnl_usd?: number;
    recent_settlements?: Array<{ id?: string; market?: string; mode?: string; direction?: string; margin_usd?: number; user_net_pnl_usd?: number; realized_pnl_usd?: number; close_reason?: string; closed_at?: number }>;
  };
  flashback_rules?: {
    version?: string;
    duration_seconds?: number;
    min_entry_usd?: number;
    max_entry_usd?: number;
    max_return_multiplier?: number;
    multiplier_step?: number;
    progressive_multiplier?: boolean;
    bands?: Array<{ up_to_usd: number | null; table: Array<{ multiplier: number; probability: number }> }>;
    payout_tables?: Record<string, Array<{ multiplier: number; probability: number }>>;
  };
  flashback_direction?: {
    version?: number;
    duration_seconds?: number;
    markets?: Array<{ symbol: string; pair?: string }>;
    schedule?: Array<{ up_to_usd: number | null; multiplier: number }>;
  };
  flashback?: {
    id?: string;
    allocation_usd?: number;
    state?: "sealed" | "ready_to_reveal" | "revealed";
    opened_at?: number;
    expires_at?: number;
    hard_loss_usd?: number;
    commitment?: string;
    close_reason?: string;
    ready_at?: number;
    revealed_at?: number;
    settled_at?: number;
    product_version?: string;
    payout_table?: Array<{ multiplier: number; probability: number }> | Record<string, unknown>;
    payout_multiplier?: number;
    return_usd?: number;
    entropy_hash?: string;
    result_ready?: boolean;
    market?: string;
    direction?: "long" | "short" | "sealed_return" | "up" | "down";
    entry_price?: number;
    entry_source?: string;
    exit_price?: number;
    exit_source?: string;
    realized_pnl?: number;
    fee_usd?: number;
    user_net_usd?: number;
    nonce?: string;
    live_reference?: {
      price?: number;
      source?: string;
      quoted_at?: number;
      move_percent?: number;
      call_status?: "ahead" | "behind" | "flat" | "unavailable";
    };
  } | null;
  flashback_sessions?: NonNullable<WorkspaceDashboard["flashback"]>[];
};

