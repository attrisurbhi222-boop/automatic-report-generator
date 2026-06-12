import { BarChart3 } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-sm">
            <BarChart3 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Insightly
          </span>
        </div>
        <nav className="flex items-center gap-6" aria-label="Primary">
          <a
            href="#how-it-works"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            How it works
          </a>
          <a
            href="#upload"
            className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.03]"
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  )
}
