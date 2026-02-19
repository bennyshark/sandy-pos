"use client"
import { useState, useTransition } from "react"
import { updateStoreSettings } from "@/lib/actions/settings"
import { Save, Check } from "lucide-react"
import type { StoreSettings } from "@/types"

interface SettingsClientProps {
  initialSettings: StoreSettings
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [s, setS] = useState(initialSettings)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const update = (key: keyof StoreSettings, value: unknown) =>
    setS((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    startTransition(async () => {
      await updateStoreSettings({
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storePhone: s.storePhone,
        storeEmail: s.storeEmail || null,
        currency: s.currency,
        currencySymbol: s.currencySymbol,
        taxRate: s.taxRate,
        taxEnabled: s.taxEnabled,
        receiptFooter: s.receiptFooter,
        receiptHeader: s.receiptHeader,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  const SectionCard = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  )

  const Field = ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      {/* Store info */}
      <SectionCard title="Store Information">
        <Field label="Store Name *">
          <input
            value={s.storeName}
            onChange={(e) => update("storeName", e.target.value)}
            className={inputClass}
            placeholder="Sandy Café"
          />
        </Field>
        <Field label="Address">
          <input
            value={s.storeAddress ?? ""}
            onChange={(e) => update("storeAddress", e.target.value)}
            className={inputClass}
            placeholder="123 Beachside Road, Manila"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              value={s.storePhone ?? ""}
              onChange={(e) => update("storePhone", e.target.value)}
              className={inputClass}
              placeholder="+63 912 345 6789"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={s.storeEmail ?? ""}
              onChange={(e) => update("storeEmail", e.target.value)}
              className={inputClass}
              placeholder="hello@sandy.cafe"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Currency & Tax */}
      <SectionCard title="Currency & Tax">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency Code">
            <input
              value={s.currency}
              onChange={(e) => update("currency", e.target.value)}
              className={inputClass}
              placeholder="PHP"
            />
          </Field>
          <Field label="Currency Symbol">
            <input
              value={s.currencySymbol}
              onChange={(e) => update("currencySymbol", e.target.value)}
              className={inputClass}
              placeholder="₱"
            />
          </Field>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={s.taxEnabled}
              onChange={(e) => update("taxEnabled", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-foreground font-medium">
              Enable Tax
            </span>
          </label>

          {s.taxEnabled && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={s.taxRate}
                onChange={(e) => update("taxRate", e.target.value)}
                className="w-24 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="12"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="text-muted-foreground text-sm font-medium">
                %
              </span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Receipt */}
      <SectionCard title="Receipt Customization">
        <Field label="Header Text">
          <textarea
            value={s.receiptHeader ?? ""}
            onChange={(e) => update("receiptHeader", e.target.value)}
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="WiFi: SandyCafe | Password: beachvibes"
          />
        </Field>
        <Field label="Footer Text">
          <textarea
            value={s.receiptFooter ?? ""}
            onChange={(e) => update("receiptFooter", e.target.value)}
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="Thank you for dining with us!"
          />
        </Field>
      </SectionCard>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? "bg-green-600 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
        } disabled:opacity-50`}
      >
        {saved ? (
          <>
            <Check size={16} /> Saved!
          </>
        ) : (
          <>
            <Save size={16} />
            {isPending ? "Saving…" : "Save Settings"}
          </>
        )}
      </button>
    </div>
  )
}
