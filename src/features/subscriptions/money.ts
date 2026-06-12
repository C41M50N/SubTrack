const CENTS_PER_DOLLAR = 100;

export function toCents(amountInDollars: number): number {
  return Math.round(amountInDollars * CENTS_PER_DOLLAR);
}

export function fromCents(amountInCents: number): number {
  return amountInCents / CENTS_PER_DOLLAR;
}

export function toMoneyString(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(fromCents(amountInCents));
}
