import { Suspense } from "react";
import { getOrders } from "@/lib/actions/orders";
import { getStoreSettings } from "@/lib/actions/settings";
import { Header } from "@/components/layout/header";
import { OrdersClient } from "@/components/orders/orders-client";
import { OrdersPageSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "Orders" };

/**
 * Async sub-component — only this part suspends.
 * The Header (and sidebar) render immediately on navigation.
 */
async function OrdersData() {
  const [orders, settings] = await Promise.all([
    getOrders(),          // ← remove the 100 cap so client-side filters have full data
    getStoreSettings(),
  ]);

  return <OrdersClient orders={orders as never} settings={settings as never} />;
}

/**
 * Page itself is NOT async → navigation is instant.
 * Suspense streams in <OrdersData> once the fetches resolve.
 */
export default function OrdersPage() {
  return (
    <>
      <Header title="Orders" subtitle="View and manage all orders" />
      <div className="flex-1 overflow-hidden p-5">
        <Suspense fallback={<OrdersPageSkeleton />}>
          <OrdersData />
        </Suspense>
      </div>
    </>
  );
}