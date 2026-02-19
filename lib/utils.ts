export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function formatCurrency(amount: number | string, symbol = "₱"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return `${symbol}0.00`
  return `${symbol}${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function generateOrderNumber(): string {
  const now = new Date()
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD-${ymd}-${random}`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":   return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "PREPARING": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "READY":     return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "COMPLETED": return "bg-sandy-100 text-sandy-800 dark:bg-amber-900/30 dark:text-amber-300"
    case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    default:          return "bg-muted text-muted-foreground"
  }
}

export function getPaymentIcon(method: string): string {
  switch (method) {
    case "CASH":  return "💵"
    case "CARD":  return "💳"
    case "GCASH": return "📱"
    case "MAYA":  return "💜"
    default:      return "💰"
  }
}
