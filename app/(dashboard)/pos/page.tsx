import { Suspense } from "react";
import { getAvailableProducts, getCategories } from "@/lib/actions/products";
import { getStoreSettings } from "@/lib/actions/settings";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { POSPageSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "POS Terminal" };

/**
 * Async sub-component — only this part suspends while data loads.
 */
async function POSData() {
  const [products, categories, settings] = await Promise.all([
    getAvailableProducts(),
    getCategories(),
    getStoreSettings(),
  ]);

  return (
    <POSTerminal
      products={products as never}
      categories={categories as never}
      settings={settings as never}
    />
  );
}

/**
 * Page itself is NOT async → sidebar + layout render instantly on navigation.
 */
export default function POSPage() {
  return (
    <Suspense fallback={<POSPageSkeleton />}>
      <POSData />
    </Suspense>
  );
}