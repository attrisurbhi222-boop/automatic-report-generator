import { SiteHeader } from "@/components/site-header"
import { ReportWorkspace } from "@/components/report-workspace"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <ReportWorkspace />
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>Insightly — Automatic Report Generator</p>
          <p>Built with Next.js</p>
        </div>
      </footer>
    </div>
  )
}
