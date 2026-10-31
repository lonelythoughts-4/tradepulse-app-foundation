type IdentifiedBot = { id: string };

export function reconcileCreatedBot<TBot extends IdentifiedBot, TWallet extends object>(
  current: { wallet: TWallet; bots: TBot[] },
  createdBot: TBot,
  returnedWallet?: Partial<TWallet> | null,
) {
  return {
    wallet: returnedWallet ? { ...current.wallet, ...returnedWallet } : current.wallet,
    bots: current.bots.some((bot) => bot.id === createdBot.id)
      ? current.bots.map((bot) => bot.id === createdBot.id ? { ...bot, ...createdBot } : bot)
      : [...current.bots, createdBot],
  };
}

export function flashbackSettlementPresentation(session: {
  product_version?: string;
  close_reason?: string;
}) {
  const isEntropyRefund = session.product_version === "sealed-return-v2"
    && session.close_reason === "entropy_unavailable_refund";
  return isEntropyRefund
    ? {
        isEntropyRefund: true,
        outcome: "ENTRY RETURNED",
        settlement: "ENTRY RETURNED",
        explanation: "The external entropy source did not respond during the resolution window. Your full entry was returned and no random return was selected.",
      }
    : {
        isEntropyRefund: false,
        outcome: "",
        settlement: "",
        explanation: "",
      };
}
