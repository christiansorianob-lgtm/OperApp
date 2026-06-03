import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
    if (!date) return '-'
    const d = new Date(date)
    return format(d, "d/MMM/yyyy", { locale: es }).replace(/\/([a-z])/, (match, p1) => `/${p1.toUpperCase()}`)
}
