export function liveNetPnlLabel(value: number): string {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));
  const signed = amount > 0 ? `+${formatted}` : amount < 0 ? `−${formatted}` : formatted;
  return `LIVE NET P/L ${signed}`;
}
