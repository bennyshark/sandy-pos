"use client";
import { useState, useTransition, useMemo } from "react";
import { updateOrderStatus } from "@/lib/actions/orders";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getPaymentIcon,
} from "@/lib/utils";
import { ExternalLink, Search, SlidersHorizontal } from "lucide-react";
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

const TIME_FILTERS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Value" },
  { value: "lowest", label: "Lowest Value" },
] as const;

const ORDER_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "DINE_IN", label: "🪑 Dine In" },
  { value: "TAKEOUT", label: "🛍️ Takeout" },
  { value: "DELIVERY", label: "🛵 Delivery" },
] as const;

const PAYMENT_FILTERS = [
  { value: "ALL", label: "All Payments" },
  { value: "CASH", label: "💵 Cash" },
  { value: "CARD", label: "💳 Card" },
  { value: "GCASH", label: "📱 GCash" },
  { value: "MAYA", label: "💜 Maya" },
] as const;

// Statuses currently being handled in the kitchen
const ACTIVE_STATUSES = ["PENDING", "PREPARING", "READY"];

export function OrdersClient({
  orders: initialOrders,
  settings,
}: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] =
    useState<"today" | "week" | "month" | "all">("today");
  const [sortBy, setSortBy] =
    useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...orders];

    // Time filter
    const now = new Date();
    if (timeFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= start);
    } else if (timeFilter === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= start);
    } else if (timeFilter === "month") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= start);
    }

    // Type filter
    if (typeFilter !== "ALL")
      result = result.filter((o) => o.type === typeFilter);

    // Payment filter
    if (paymentFilter !== "ALL")
      result = result.filter((o) => o.paymentMethod === paymentFilter);

    // Search: order number, customer name, or product names
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "newest")
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    else if (sortBy === "oldest")
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    else if (sortBy === "highest")
      result.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    else if (sortBy === "lowest")
      result.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));

    return result;
  }, [orders, timeFilter, sortBy, typeFilter, paymentFilter, search]);

  const handleCancel = (id: string) => {
    startTransition(async () => {
      await updateOrderStatus(id, "CANCELLED");
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o))
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : null
        );
      }
    });
  };

  const typeEmoji = (type: string) => {
    if (type === "DINE_IN") return "🪑";
    if (type === "TAKEOUT") return "🛍️";
    return "🛵";
  };

  return (
    <div className="flex gap-5 h-full overflow-hidden">
      {/* Order list */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3 overflow-hidden">
        {/* Search + Filter toggle */}
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <span className="self-center text-xs text-muted-foreground shrink-0">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shrink-0">
            {/* Time */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Time Period
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {TIME_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTimeFilter(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeFilter === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Sort By
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Order Type
                </p>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {ORDER_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Payment
                </p>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  {PAYMENT_FILTERS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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
                  {["Order #", "Type", "Status", "Total", "Date", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                          i === 0 || i === 1 ? "text-left" : "text-right"
                        } ${i === 3 ? "hidden md:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-14 text-muted-foreground text-sm"
                    >
                      <p className="text-3xl mb-2">📋</p>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? "bg-primary/5 border-l-[3px] border-l-primary"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground text-sm">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-muted-foreground">
                          {typeEmoji(order.type)}{" "}
                          {order.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-primary font-bold text-sm">
                          {formatCurrency(
                            order.total,
                            settings.currencySymbol
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
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
        </div>
      </div>

      {/* Detail panel */}
      {selectedOrder && (
        <div className="w-72 bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 shrink-0 overflow-y-auto">
          <div>
            <h3
              className="font-bold text-foreground text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {selectedOrder.orderNumber}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {formatDateTime(selectedOrder.createdAt)}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
                selectedOrder.status
              )}`}
            >
              {selectedOrder.status}
            </span>
            {selectedOrder.paymentMethod && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                {getPaymentIcon(selectedOrder.paymentMethod)}{" "}
                {selectedOrder.paymentMethod}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-t border-border pt-3">
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground text-xs">
                  {item.productName} ×{item.quantity}
                </span>
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

          {/* Kitchen redirect for active orders */}
          {ACTIVE_STATUSES.includes(selectedOrder.status) && (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                🍳 This order is being handled in the{" "}
                <a
                  href="/kitchen"
                  className="text-primary underline underline-offset-2 font-medium"
                >
                  Kitchen Display
                </a>
              </p>
            </div>
          )}

          {/* Cancel — only available for COMPLETED orders */}
          {selectedOrder.status === "COMPLETED" && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Actions
              </p>
              <button
                onClick={() => handleCancel(selectedOrder.id)}
                disabled={isPending}
                className="w-full py-2 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50"
              >
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