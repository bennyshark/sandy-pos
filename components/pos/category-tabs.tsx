"use client"
import type { Category } from "@/types"

interface CategoryTabsProps {
  categories: Category[]
  activeId: string | null
  onChange: (id: string | null) => void
}

export function CategoryTabs({
  categories,
  activeId,
  onChange,
}: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border overflow-x-auto shrink-0">
      <button
        onClick={() => onChange(null)}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
          ${
            !activeId
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          }
        `}
      >
        ☕ All Items
      </button>

      {categories
        .filter((c) => c.isActive)
        .map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${
                activeId === cat.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }
            `}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
    </div>
  )
}
