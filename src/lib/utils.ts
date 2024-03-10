import { type ClassValue, clsx } from "clsx"
import dayjs from "dayjs"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toXCase(str: string): string {
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

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December'
type Year = number
export function getNextNMonths(n: number) {
  const res: Array<[Month, Year]> = []
  for (let offset = 0; offset < n; offset++) {
    const day = dayjs().add(1 + offset, 'month')
    res.push([day.format('MMMM') as Month, day.year()])
  }
  return res;
}
