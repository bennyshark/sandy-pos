"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Coffee,
  Menu,
  X,
  ChefHat,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

// AFTER
const navItems = [
  { href: "/pos",       label: "POS Terminal",  icon: ShoppingCart,    roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/kitchen",   label: "Kitchen View",  icon: ChefHat,         roles: ["OWNER", "MANAGER", "KITCHEN"] },
  { href: "/dashboard", label: "Dashboard",     icon: LayoutDashboard, roles: ["OWNER", "MANAGER"] },
  { href: "/orders",    label: "Orders",        icon: ClipboardList,   roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/menu",      label: "Menu & Items",  icon: Package,         roles: ["OWNER", "MANAGER"] },
  { href: "/inventory", label: "Inventory",     icon: BarChart3,       roles: ["OWNER", "MANAGER"] },
  { href: "/settings",  label: "Settings",      icon: Settings,        roles: ["OWNER"] },
]
export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-xl border border-border shadow-md"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 sidebar-gradient
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0
          flex flex-col shrink-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/pos" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #d4a958 0%, #a4752d 100%)",
              }}
            >
              <Coffee size={18} className="text-white" />
            </div>
            <div>
              <p
                className="font-bold text-xl text-white leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sandy
              </p>
              <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-widest">
                POS System
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${
                    active
                      ? "bg-primary/90 text-white shadow-lg shadow-primary/20"
                      : "text-white/55 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-6 pt-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
