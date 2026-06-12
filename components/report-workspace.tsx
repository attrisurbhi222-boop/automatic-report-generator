"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import type { AnalysisResult } from "@/lib/analysis"
import { UploadZone } from "@/components/upload-zone"
import { ReportDashboard } from "@/components/report-dashboard"
import { HowItWorks } from "@/components/how-it-works"

export function ReportWorkspace() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  if (analysis) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
        <ReportDashboard analysis={analysis} onReset={() => setAnalysis(null)} />
      </section>
    )
  }

  return (
    <>
      <section
        id="upload"
        className="relative mx-auto w-full max-w-6xl px-6 pb-8 pt-16 sm:pt-24"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Automatic Report Generator
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Turn raw files into{" "}
              <span className="gradient-brand-text">beautiful reports</span> in seconds
            </h1>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
              Upload a CSV or JSON file and Insightly automatically analyzes your data, builds
              an interactive dashboard, and generates a downloadable PDF report.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No setup required", "Secure parsing", "Instant PDF export"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full gradient-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/30 p-6 shadow-xl sm:p-8">
            <UploadZone onAnalyzed={setAnalysis} />
          </div>
        </div>
      </section>

      <HowItWorks />
    </>
  )
}
