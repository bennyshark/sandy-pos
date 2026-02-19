import { getStoreSettings } from "@/lib/actions/settings"
import { Header } from "@/components/layout/header"
import { SettingsClient } from "@/components/settings/settings-client"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const settings = await getStoreSettings()

  return (
    <>
      <Header title="Settings" subtitle="Configure your store" />
      <div className="flex-1 overflow-y-auto p-5">
        <SettingsClient initialSettings={settings as never} />
      </div>
    </>
  )
}
