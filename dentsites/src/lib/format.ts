import { siteConfig } from "@/config/site";

const money = new Intl.NumberFormat(siteConfig.locale, { style: "currency", currency: siteConfig.currency, maximumFractionDigits: 0 });

/** A fee in the clinic's currency, e.g. "$1,350". */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** "from $1,350" for fees that vary with the case. */
export function formatFee(fee: { amount: number; from?: boolean }): string {
  return `${fee.from ? "from " : ""}${formatMoney(fee.amount)}`;
}
