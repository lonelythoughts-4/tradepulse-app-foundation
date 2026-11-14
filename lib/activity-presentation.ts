export type ActivityRecord = {
  kind: string;
  status?: string;
  asset?: string;
  chain?: string;
  trade_detail?: {
    bot_name?: string;
    position?: {
      symbol?: string;
      direction?: string;
      close_reason?: string;
    };
  };
};

type ActivityPresentation = {
  title: string;
  summary: string;
  status: string;
};

const networkNames: Record<string, string> = {
  ERC20: "Ethereum",
  BEP20: "BNB Chain",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
  POLYGON: "Polygon",
  SPL: "Solana",
  TON: "TON",
  ETH_SEPOLIA: "Ethereum Sepolia",
  BNB_TESTNET: "BNB Smart Chain Testnet",
  BASE_SEPOLIA: "Base Sepolia",
  ARB_SEPOLIA: "Arbitrum Sepolia",
  POLYGON_AMOY: "Polygon Amoy",
  SOL_DEVNET: "Solana Devnet",
};

const statusNames: Record<string, string> = {
  settled: "Settled",
  simulated: "Simulated",
  simulated_settled: "Simulated",
  credited: "Credited",
  accrued: "Accrued",
  applied: "Applied",
  reserved: "Reserved",
  queued: "Queued",
  locked: "Locked",
  pending: "Pending",
  pending_admin_release: "Awaiting release",
  nonwithdrawable: "Trading credit",
};

const titleWords = (value: string) => value
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function formatActivityStatus(status = ""): string {
  const normalized = status.toLowerCase();
  return statusNames[normalized] || titleWords(normalized || "recorded");
}

export function formatActivityExitReason(reason?: string): string {
  const labels: Record<string, string> = {
    take_profit: "Take profit",
    stop_loss: "Stop loss",
    user_close: "Closed by you",
  };
  return reason ? labels[reason.toLowerCase()] || titleWords(reason) : "Closed at the recorded settlement price";
}

const network = (chain?: string) => chain ? networkNames[chain] || titleWords(chain) : "";

const route = (entry: ActivityRecord) => [entry.asset, network(entry.chain)].filter(Boolean).join(" on ");

const isSimulatedEvent = (kind: string) => kind.startsWith("autouser_");

export function describeActivity(entry: ActivityRecord): ActivityPresentation {
  const kind = entry.kind.toLowerCase();
  const rawStatus = entry.status?.toLowerCase() || "";
  const status = formatActivityStatus(entry.status);
  const detail = entry.trade_detail;
  const position = detail?.position;
  const strategyName = detail?.bot_name || "Automated strategy";

  if (kind === "deposit_credit") {
    return { title: "Deposit credited", summary: `${route(entry) || "Verified deposit"} added to your available wallet balance`, status };
  }
  if (kind === "withdraw") {
    const withdrawalSummary = rawStatus === "reserved"
      ? "held from your available balance until release"
      : rawStatus === "queued"
        ? "submitted for processing"
        : "recorded for this withdrawal";
    return { title: `Withdrawal ${status.toLowerCase()}`, summary: `${route(entry) || "Withdrawal"} · ${withdrawalSummary}`, status };
  }
  if (kind === "strategy_protection_credit") {
    return { title: "Strategy Protection credited", summary: "Protection credit added to your available wallet balance", status };
  }
  if (kind === "performance_fee") {
    return { title: "Performance fee charged", summary: "Charged only after a profitable strategy settlement", status };
  }
  if (kind === "demo_fee_credit_used") {
    return { title: "Demo fee credit applied", summary: "Eligible fee credit used for this settled strategy", status };
  }
  if (kind === "demo_conversion_trade_credit") {
    return { title: "Demo trading credit issued", summary: "Non-withdrawable trading credit added to your desk", status };
  }
  if (kind === "bot_topup") {
    return { title: "Strategy allocation funded", summary: "Capital moved from your wallet into the strategy allocation", status };
  }
  if (kind === "admin_funding") {
    return { title: "Wallet funding credited", summary: "Funds added to your available wallet balance", status };
  }
  if (kind === "identity_change_fee") {
    return { title: "Identity change fee charged", summary: "Fee recorded for your confirmed account identity change", status };
  }
  if (kind === "memecoin_beta_authorized") {
    return { title: "Memecoin automation authorized", summary: "Your saved automatic-entry rules are now active", status };
  }
  if (kind === "flashback_allocation") {
    return { title: "Flashback entry locked", summary: "Entry remains locked until the sealed result is revealed", status };
  }
  if (kind === "flashback_return" || kind === "flashback_direction_return") {
    return { title: "Flashback return credited", summary: "Settled return added to your available wallet balance", status };
  }
  if (kind === "flashback_refund" || kind === "flashback_direction_refund") {
    return { title: "Flashback entry returned", summary: "The locked entry was returned to your available wallet balance", status };
  }
  if (kind === "flashback_loss" || kind === "flashback_direction_loss") {
    return { title: "Flashback result recorded", summary: "The sealed result has been settled for this entry", status };
  }
  if (kind.startsWith("autouser_simulated_")) {
    const event = kind.replace("autouser_simulated_", "");
    const simulatedTitles: Record<string, string> = {
      deposit: "Testnet deposit credited",
      withdrawal: "Testnet withdrawal completed",
      topup: "Testnet strategy allocation funded",
    };
    const simulatedSummaries: Record<string, string> = {
      deposit: "Test funds added to your separate testnet balance",
      withdrawal: "Test funds removed from your separate testnet balance",
      topup: "Test funds moved into the testnet strategy allocation",
    };
    return {
      title: simulatedTitles[event] || "Testnet account event completed",
      summary: simulatedSummaries[event] || "Recorded only in your separate testnet workspace",
      status,
    };
  }
  if (kind === "autouser_event_allocation") {
    return { title: "Testnet allocation funded", summary: "Test funds assigned to your separate testnet balance", status };
  }
  if (kind === "autouser_event_bot_started") {
    return { title: "Testnet bot started", summary: "The test strategy is active in your separate testnet workspace", status };
  }
  if (["trading_profit", "profit", "trading_loss", "loss", "trading_settlement"].includes(kind)) {
    const outcome = kind.includes("profit") ? "profit" : kind.includes("loss") ? "loss" : "settlement";
    const title = `${strategyName} trade ${outcome}`;
    if (position?.symbol) {
      const direction = position.direction ? ` · ${position.direction.toUpperCase()}` : "";
      return { title, summary: `${position.symbol}${direction} · ${formatActivityExitReason(position.close_reason)}`, status };
    }
    return { title, summary: `${strategyName} result posted to your wallet balance`, status };
  }
  if (isSimulatedEvent(kind)) {
    return { title: "Testnet account event", summary: "Recorded only in your separate testnet workspace", status };
  }
  return {
    title: titleWords(kind || "account activity"),
    summary: route(entry) || "This account event was recorded with its current status",
    status,
  };
}
