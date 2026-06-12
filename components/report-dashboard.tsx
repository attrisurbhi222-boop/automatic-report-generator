"use client"

import { useState } from "react"
import {
  Database,
  Columns3,
  Hash,
  CircleCheck,
  Download,
  RotateCcw,
  Loader2,
} from "lucide-react"
import type { AnalysisResult } from "@/lib/analysis"
import { MetricCard } from "@/components/metric-card"
import { TrendChart, NumericMeansChart, CategoryChart } from "@/components/report-charts"

export function ReportDashboard({
  analysis,
  onReset,
}: {
  analysis: AnalysisResult
  onReset: () => void
}) {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleDownload() {
    setExporting(true)
    setExportError(null)
    try {
      const { default: jsPDF } = await import("jspdf")

      const pdf = new jsPDF("p", "mm", "a4")
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 14
      const contentW = pageW - margin * 2
      let y = margin

      // Brand colors (RGB equivalents of the blue→green theme)
      const blue: [number, number, number] = [37, 99, 235]
      const green: [number, number, number] = [16, 185, 129]
      const dark: [number, number, number] = [30, 41, 59]
      const gray: [number, number, number] = [100, 116, 139]

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage()
          y = margin
        }
      }

      // Header band
      pdf.setFillColor(...blue)
      pdf.rect(0, 0, pageW, 26, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Data Analysis Report", margin, 13)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${analysis.fileName}  •  ${new Date().toLocaleString()}`,
        margin,
        20,
      )
      y = 36

      // Key metrics
      const metrics: [string, string][] = [
        ["Total records", analysis.totalRecords.toLocaleString()],
        ["Columns", String(analysis.totalColumns)],
        ["Numeric fields", String(analysis.numericColumnCount)],
        ["Completeness", `${analysis.completeness}%`],
      ]
      const cardW = (contentW - 9) / 4
      metrics.forEach(([label, value], i) => {
        const x = margin + i * (cardW + 3)
        pdf.setDrawColor(226, 232, 240)
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, y, cardW, 20, 2, 2, "FD")
        pdf.setTextColor(...gray)
        pdf.setFontSize(7.5)
        pdf.text(label.toUpperCase(), x + 3, y + 6)
        pdf.setTextColor(...dark)
        pdf.setFontSize(13)
        pdf.setFont("helvetica", "bold")
        pdf.text(value, x + 3, y + 15)
        pdf.setFont("helvetica", "normal")
      })
      y += 30

      // Simple table renderer
      const drawTable = (
        title: string,
        headers: string[],
        rows: string[][],
      ) => {
        ensureSpace(16)
        pdf.setTextColor(...dark)
        pdf.setFontSize(12)
        pdf.setFont("helvetica", "bold")
        pdf.text(title, margin, y)
        y += 4
        pdf.setFont("helvetica", "normal")

        const colW = contentW / headers.length
        const rowH = 8

        // header row
        pdf.setFillColor(...green)
        pdf.rect(margin, y, contentW, rowH, "F")
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "bold")
        headers.forEach((h, i) => {
          pdf.text(String(h).slice(0, 18), margin + i * colW + 2, y + 5.5)
        })
        y += rowH

        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(...dark)
        rows.forEach((row, ri) => {
          ensureSpace(rowH)
          if (y === margin) {
            // re-draw header continuation
            pdf.setFillColor(...green)
            pdf.rect(margin, y, contentW, rowH, "F")
            pdf.setTextColor(255, 255, 255)
            pdf.setFont("helvetica", "bold")
            headers.forEach((h, i) => {
              pdf.text(String(h).slice(0, 18), margin + i * colW + 2, y + 5.5)
            })
            y += rowH
            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(...dark)
          }
          if (ri % 2 === 0) {
            pdf.setFillColor(241, 245, 249)
            pdf.rect(margin, y, contentW, rowH, "F")
          }
          row.forEach((cell, i) => {
            pdf.text(String(cell ?? "—").slice(0, 18), margin + i * colW + 2, y + 5.5)
          })
          y += rowH
        })
        y += 8
      }

      if (analysis.numericSummaries.length > 0) {
        drawTable(
          "Numeric Summary",
          ["Column", "Min", "Max", "Mean", "Median", "Std Dev", "Sum"],
          analysis.numericSummaries.map((s) => [
            s.column,
            s.min.toLocaleString(),
            s.max.toLocaleString(),
            s.mean.toLocaleString(),
            s.median.toLocaleString(),
            s.stdDev.toLocaleString(),
            s.sum.toLocaleString(),
          ]),
        )
      }

      const previewCols = analysis.columns.slice(0, 6).map((c) => c.name)
      if (analysis.preview.length > 0) {
        drawTable(
          "Data Preview",
          previewCols,
          analysis.preview.map((row) =>
            previewCols.map((c) => {
              const v = row[c]
              return v === null || v === undefined || v === "" ? "—" : String(v)
            }),
          ),
        )
      }

      // Footer page numbers
      const pageCount = pdf.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p)
        pdf.setFontSize(8)
        pdf.setTextColor(...gray)
        pdf.text(
          `Generated by Insightly  •  Page ${p} of ${pageCount}`,
          margin,
          pageH - 6,
        )
      }

      const base = analysis.fileName.replace(/\.[^.]+$/, "") || "report"
      pdf.save(`${base}-report.pdf`)
    } catch (err) {
      console.error("[v0] PDF export failed:", err)
      setExportError("Could not generate the PDF. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const previewColumns = analysis.columns.slice(0, 6).map((c) => c.name)

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Report preview</h2>
          <p className="text-sm text-muted-foreground">
            Generated from <span className="font-medium text-foreground">{analysis.fileName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> New file
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] disabled:opacity-70"
          >
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing…
              </>
            ) : (
              <>
                <Download className="size-4" aria-hidden="true" /> Download Report
              </>
            )}
          </button>
        </div>
      </div>
      {exportError && (
        <p className="mb-4 text-sm font-medium text-destructive" role="alert">
          {exportError}
        </p>
      )}
      <div className="space-y-6 rounded-2xl bg-background p-1">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Total records"
            value={analysis.totalRecords.toLocaleString()}
            hint="Rows analyzed"
            icon={Database}
            accent
          />
          <MetricCard
            label="Columns"
            value={String(analysis.totalColumns)}
            hint={`${analysis.numericColumnCount} numeric · ${analysis.categoricalColumnCount} categorical`}
            icon={Columns3}
          />
          <MetricCard
            label="Numeric fields"
            value={String(analysis.numericColumnCount)}
            hint="Summarized below"
            icon={Hash}
          />
          <MetricCard
            label="Completeness"
            value={`${analysis.completeness}%`}
            hint={`${analysis.totalMissing.toLocaleString()} missing values`}
            icon={CircleCheck}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TrendChart analysis={analysis} />
          <NumericMeansChart analysis={analysis} />
          <CategoryChart analysis={analysis} />
        </div>

        {analysis.numericSummaries.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Numeric summary</h3>
              <p className="text-xs text-muted-foreground">Key statistics per numeric column</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Column</th>
                    <th className="px-4 py-3 font-medium">Min</th>
                    <th className="px-4 py-3 font-medium">Max</th>
                    <th className="px-4 py-3 font-medium">Mean</th>
                    <th className="px-4 py-3 font-medium">Median</th>
                    <th className="px-4 py-3 font-medium">Std Dev</th>
                    <th className="px-4 py-3 font-medium">Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.numericSummaries.map((s) => (
                    <tr key={s.column} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{s.column}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.min.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.max.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.mean.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.median.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.stdDev.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.sum.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Data preview</h3>
            <p className="text-xs text-muted-foreground">First {analysis.preview.length} records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {previewColumns.map((c) => (
                    <th key={c} className="px-5 py-3 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.preview.map((row, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    {previewColumns.map((c) => (
                      <td key={c} className="max-w-48 truncate px-5 py-3 text-muted-foreground">
                        {row[c] === null || row[c] === undefined || row[c] === ""
                          ? "—"
                          : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
