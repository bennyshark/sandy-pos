"use client"
import { useTheme } from "@/components/providers/theme-provider"
import { Sun, Moon } from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const { data: session } = useSession()

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-5 shrink-0">
      <div>
        <h1 className="font-semibold text-foreground text-base leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div className="flex items-center gap-2.5 pl-2.5 border-l border-border">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={30}
              height={30}
              className="rounded-full border-2 border-primary/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                {session?.user?.name?.[0] ?? "U"}
              </span>
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-none">
              {session?.user?.name?.split(" ")[0] ?? "User"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
              {(session?.user as { role?: string })?.role ?? "CASHIER"}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
