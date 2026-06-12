export type ColumnType = "numeric" | "categorical" | "date" | "boolean"

export interface NumericSummary {
  column: string
  count: number
  missing: number
  min: number
  max: number
  mean: number
  median: number
  sum: number
  stdDev: number
}

export interface CategoricalSummary {
  column: string
  unique: number
  missing: number
  top: { value: string; count: number }[]
}

export interface ColumnMeta {
  name: string
  type: ColumnType
  missing: number
}

export interface TrendPoint {
  label: string
  value: number
}

export interface NumericTrend {
  column: string
  points: TrendPoint[]
}

export interface AnalysisResult {
  fileName: string
  fileType: "csv" | "json"
  totalRecords: number
  totalColumns: number
  numericColumnCount: number
  categoricalColumnCount: number
  totalMissing: number
  completeness: number // 0-100
  columns: ColumnMeta[]
  numericSummaries: NumericSummary[]
  categoricalSummaries: CategoricalSummary[]
  trends: NumericTrend[]
  preview: Record<string, unknown>[]
}

type Row = Record<string, unknown>

function isMissing(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v))
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,%\s]/g, "")
    if (cleaned === "") return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const BOOL_VALUES = new Set(["true", "false", "yes", "no", "0", "1"])

function looksLikeDate(v: unknown): boolean {
  if (typeof v !== "string") return false
  if (!/[-/:]/.test(v) && !/\d{4}/.test(v)) return false
  const t = Date.parse(v)
  return !Number.isNaN(t)
}

function inferType(values: unknown[]): ColumnType {
  const nonMissing = values.filter((v) => !isMissing(v))
  if (nonMissing.length === 0) return "categorical"

  const numericCount = nonMissing.filter((v) => toNumber(v) !== null).length
  if (numericCount / nonMissing.length >= 0.8) return "numeric"

  const boolCount = nonMissing.filter(
    (v) => typeof v !== "object" && BOOL_VALUES.has(String(v).toLowerCase()),
  ).length
  if (boolCount / nonMissing.length >= 0.9) return "boolean"

  const dateCount = nonMissing.filter((v) => looksLikeDate(v)).length
  if (dateCount / nonMissing.length >= 0.8) return "date"

  return "categorical"
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/**
 * Analyzes an array of row objects and produces summary statistics,
 * column metadata, and chartable trends.
 */
export function analyzeRows(
  rows: Row[],
  fileName: string,
  fileType: "csv" | "json",
): AnalysisResult {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No records found in the file.")
  }

  // Collect the union of all keys across rows (JSON can be ragged).
  const columnSet = new Set<string>()
  for (const row of rows.slice(0, 1000)) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      for (const k of Object.keys(row)) columnSet.add(k)
    }
  }
  const columnNames = Array.from(columnSet)
  if (columnNames.length === 0) {
    throw new Error("Could not detect any columns in the file.")
  }

  const columns: ColumnMeta[] = []
  const numericSummaries: NumericSummary[] = []
  const categoricalSummaries: CategoricalSummary[] = []
  const trends: NumericTrend[] = []
  let totalMissing = 0

  for (const name of columnNames) {
    const values = rows.map((r) => (r as Row)?.[name])
    const missing = values.filter(isMissing).length
    totalMissing += missing
    const type = inferType(values)
    columns.push({ name, type, missing })

    if (type === "numeric") {
      const nums = values.map(toNumber).filter((n): n is number => n !== null)
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0)
        const mean = sum / nums.length
        const sorted = [...nums].sort((a, b) => a - b)
        const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length
        numericSummaries.push({
          column: name,
          count: nums.length,
          missing,
          min: round(sorted[0]),
          max: round(sorted[sorted.length - 1]),
          mean: round(mean),
          median: round(median(sorted)),
          sum: round(sum),
          stdDev: round(Math.sqrt(variance)),
        })

        // Build a downsampled trend (max 24 points) for charting.
        const maxPoints = 24
        const step = Math.max(1, Math.ceil(nums.length / maxPoints))
        const points: TrendPoint[] = []
        for (let i = 0; i < nums.length; i += step) {
          points.push({ label: String(i + 1), value: round(nums[i]) })
        }
        trends.push({ column: name, points })
      }
    } else {
      const counts = new Map<string, number>()
      for (const v of values) {
        if (isMissing(v)) continue
        const key = String(v)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      const top = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      categoricalSummaries.push({
        column: name,
        unique: counts.size,
        missing,
        top,
      })
    }
  }

  const totalCells = rows.length * columnNames.length
  const completeness = totalCells > 0 ? round(((totalCells - totalMissing) / totalCells) * 100, 1) : 100

  return {
    fileName,
    fileType,
    totalRecords: rows.length,
    totalColumns: columnNames.length,
    numericColumnCount: numericSummaries.length,
    categoricalColumnCount: categoricalSummaries.length,
    totalMissing,
    completeness,
    columns,
    numericSummaries,
    categoricalSummaries,
    trends,
    preview: rows.slice(0, 8) as Record<string, unknown>[],
  }
}
