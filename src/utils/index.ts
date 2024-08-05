import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function toProperCase(str: string): string {
  if (str.includes('.')) {
    str = str.split('.')[0]!
  }

  let parts: string[] = []
  if (str.includes('-')) {
    parts = str.split('-')
  } else {
    parts = [str, " "]
  }
  return parts.reduce((a,b) => a.at(0)?.toUpperCase() + a.slice(1,) + " " + b.at(0)?.toUpperCase() + b.slice(1,)).trim()
}

export function toMoneyString(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
