"use client";
import { useState, useTransition, useMemo } from "react";
import { updateOrderStatus } from "@/lib/actions/orders";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getPaymentIcon,
} from "@/lib/utils";
import { ExternalLink, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { StoreSettings } from "@/types";

type OrderItem = {
  productName: string;
  quantity: number;
  subtotal: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  tableNumber: string | null;
  customerName: string | null;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  paymentMethod: string | null;
  receiptToken: string | null;
  createdAt: Date;
  items: OrderItem[];
  cashier?: { name: string | null } | null;
};

interface OrdersClientProps {
  orders: Order[];
  settings: StoreSettings;
}

const PAGE_SIZE = 25;

const TIME_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week",  label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "all",   label: "All Time" },
] as const;

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest First" },
  { value: "oldest",  label: "Oldest First" },
  { value: "highest", label: "Highest Value" },
  { value: "lowest",  label: "Lowest Value" },
] as const;

const ORDER_TYPES = [
  { value: "ALL",      label: "All Types" },
  { value: "DINE_IN",  label: "🪑 Dine In" },
  { value: "TAKEOUT",  label: "🛍️ Takeout" },
  { value: "DELIVERY", label: "🛵 Delivery" },
] as const;

const PAYMENT_FILTERS = [
  { value: "ALL",   label: "All Payments" },
  { value: "CASH",  label: "💵 Cash" },
  { value: "CARD",  label: "💳 Card" },
  { value: "GCASH", label: "📱 GCash" },
  { value: "MAYA",  label: "💜 Maya" },
] as const;

const ACTIVE_STATUSES = ["PENDING", "PREPARING", "READY"];

export function OrdersClient({ orders: initialOrders, settings }: OrdersClientProps) {
  const [orders, setOrders]               = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPending, startTransition]      = useTransition();
  const [page, setPage]                   = useState(0);

  // Filters
  const [search, setSearch]               = useState("");
  const [timeFilter, setTimeFilter]       = useState<"today" | "week" | "month" | "all">("all");
  const [specificDate, setSpecificDate]   = useState("");
  const [sortBy, setSortBy]               = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [typeFilter, setTypeFilter]       = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [showFilters, setShowFilters]     = useState(false);

  // Reset to page 0 whenever filters change
  function updateFilter<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(0); };
  }

  const filtered = useMemo(() => {
    let result = [...orders];

    // Specific date takes priority over time period pills
    if (specificDate) {
      const start = new Date(specificDate + "T00:00:00");
      const end   = new Date(specificDate + "T23:59:59.999");
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
      });
    } else {
      const now = new Date();
      if (timeFilter === "today") {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        result = result.filter((o) => new Date(o.createdAt) >= start);
      } else if (timeFilter === "week") {
        const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
        result = result.filter((o) => new Date(o.createdAt) >= start);
      } else if (timeFilter === "month") {
        const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
        result = result.filter((o) => new Date(o.createdAt) >= start);
      }
      // "all" — no date filter
    }

    if (typeFilter !== "ALL")    result = result.filter((o) => o.type === typeFilter);
    if (paymentFilter !== "ALL") result = result.filter((o) => o.paymentMethod === paymentFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }

    if (sortBy === "newest")       result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest")  result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "highest") result.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    else if (sortBy === "lowest")  result.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));

    return result;
  }, [orders, timeFilter, specificDate, sortBy, typeFilter, paymentFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const paginated  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleCancel = (id: string) => {
    startTransition(async () => {
      await updateOrderStatus(id, "CANCELLED");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o)));
      if (selectedOrder?.id === id)
        setSelectedOrder((prev) => prev ? { ...prev, status: "CANCELLED" } : null);
    });
  };

  const typeEmoji = (type: string) => {
    if (type === "DINE_IN") return "🪑";
    if (type === "TAKEOUT")  return "🛍️";
    return "🛵";
  };

  return (
    <div className="flex gap-5 h-full overflow-hidden">
      {/* Order list */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3 overflow-hidden">

        {/* Search + Filter toggle */}
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => updateFilter(setSearch)(e.target.value)}
              placeholder="Search by order #, customer, or product…"
              className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              showFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
          </button>
          {isPending && <Loader2 size={16} className="self-center text-muted-foreground animate-spin shrink-0" />}
          <span className="self-center text-xs text-muted-foreground shrink-0">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shrink-0">

            {/* Time period */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Time Period
              </p>
              <div className="flex gap-1.5 flex-wrap items-center">
                {TIME_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      updateFilter(setTimeFilter)(value);
                      updateFilter(setSpecificDate)("");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeFilter === value && !specificDate
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {/* Divider */}
                <span className="text-border select-none text-sm px-0.5">|</span>

                {/* Specific date */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground font-medium shrink-0">
                    Specific date:
                  </label>
                  <input
                    type="date"
                    value={specificDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => updateFilter(setSpecificDate)(e.target.value)}
                    className={`text-xs rounded-lg border px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer ${
                      specificDate
                        ? "bg-primary text-primary-foreground border-primary [color-scheme:dark]"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                  />
                  {specificDate && (
                    <button
                      onClick={() => updateFilter(setSpecificDate)("")}
                      className="w-5 h-5 flex items-center justify-center rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Clear date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Active date label */}
              {specificDate && (
                <p className="text-xs text-primary font-medium mt-1.5">
                  📅 Showing orders for{" "}
                  {new Date(specificDate + "T00:00:00").toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sort By</p>
                <select
                  value={sortBy}
                  onChange={(e) => updateFilter(setSortBy)(e.target.value as typeof sortBy)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              {/* Order type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Order Type</p>
                <select
                  value={typeFilter}
                  onChange={(e) => updateFilter(setTypeFilter)(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {ORDER_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Payment</p>
                <select
                  value={paymentFilter}
                  onChange={(e) => updateFilter(setPaymentFilter)(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {PAYMENT_FILTERS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-card">
                  {["Order #", "Type", "Status", "Total", "Date", ""].map((h, i) => (
                    <th
                      key={h || i}
                      className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                        i === 0 || i === 1 ? "text-left" : "text-right"
                      } ${i === 3 ? "hidden md:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-muted-foreground text-sm">
                      <p className="text-3xl mb-2">📋</p>
                      {specificDate
                        ? `No orders on ${new Date(specificDate + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}`
                        : "No orders found"}
                    </td>
                  </tr>
                ) : (
                  paginated.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? "bg-primary/5 border-l-[3px] border-l-primary" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-muted-foreground">
                          {typeEmoji(order.type)} {order.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-primary font-bold text-sm">
                          {formatCurrency(order.total, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        {order.receiptToken && (
                          <a
                            href={`/receipt/${order.receiptToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors inline-flex"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-card shrink-0">
              <span className="text-xs text-muted-foreground">
                Page {safePage + 1} of {totalPages} · {filtered.length} orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => Math.abs(i - safePage) <= 2)
                  .map((i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        i === safePage ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedOrder && (
        <div className="w-72 bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 shrink-0 overflow-y-auto">
          <div>
            <h3 className="font-bold text-foreground text-base" style={{ fontFamily: "var(--font-display)" }}>
              {selectedOrder.orderNumber}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(selectedOrder.status)}`}>
              {selectedOrder.status}
            </span>
            {selectedOrder.paymentMethod && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                {getPaymentIcon(selectedOrder.paymentMethod)} {selectedOrder.paymentMethod}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-t border-border pt-3">
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground text-xs">{item.productName} ×{item.quantity}</span>
                <span className="text-muted-foreground text-xs">
                  {formatCurrency(item.subtotal, settings.currencySymbol)}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span className="text-foreground text-sm">Total</span>
              <span className="text-primary text-sm">
                {formatCurrency(selectedOrder.total, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Discount & tax breakdown if applicable */}
          {(parseFloat(selectedOrder.discountAmount) > 0 || parseFloat(selectedOrder.taxAmount) > 0) && (
            <div className="space-y-1 border-t border-border pt-3">
              {parseFloat(selectedOrder.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Discount</span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    -{formatCurrency(selectedOrder.discountAmount, settings.currencySymbol)}
                  </span>
                </div>
              )}
              {parseFloat(selectedOrder.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Tax</span>
                  <span className="text-xs text-muted-foreground">
                    +{formatCurrency(selectedOrder.taxAmount, settings.currencySymbol)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Kitchen redirect for active orders */}
          {ACTIVE_STATUSES.includes(selectedOrder.status) && (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                🍳 This order is being handled in the{" "}
                <a href="/kitchen" className="text-primary underline underline-offset-2 font-medium">
                  Kitchen Display
                </a>
              </p>
            </div>
          )}

          {/* Cancel — only for COMPLETED */}
          {selectedOrder.status === "COMPLETED" && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
              <button
                onClick={() => handleCancel(selectedOrder.id)}
                disabled={isPending}
                className="w-full py-2 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={12} className="animate-spin" />}
                Cancel Order
              </button>
            </div>
          )}

          {selectedOrder.receiptToken && (
            <a
              href={`/receipt/${selectedOrder.receiptToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted hover:bg-accent text-foreground rounded-xl text-xs font-medium transition-colors"
            >
              <ExternalLink size={13} />
              Open Receipt
            </a>
          )}
        </div>
      )}
    </div>
  );
}