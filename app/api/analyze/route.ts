import { type NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import { analyzeRows } from "@/lib/analysis"

export const runtime = "nodejs"

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value as Record<string, unknown>, nextKey))
    } else if (Array.isArray(value)) {
      out[nextKey] = value.join(", ")
    } else {
      out[nextKey] = value
    }
  }
  return out
}

function normalizeJson(parsed: unknown): Record<string, unknown>[] {
  let arr: unknown[]
  if (Array.isArray(parsed)) {
    arr = parsed
  } else if (parsed && typeof parsed === "object") {
    // Look for the first array property (common API shape: { data: [...] }).
    const values = Object.values(parsed as Record<string, unknown>)
    const firstArray = values.find((v) => Array.isArray(v)) as unknown[] | undefined
    arr = firstArray ?? [parsed]
  } else {
    throw new Error("JSON must be an array of objects or an object containing one.")
  }

  return arr
    .filter((item) => item && typeof item === "object")
    .map((item) => flatten(item as Record<string, unknown>))
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 413 })
    }

    const name = file.name.toLowerCase()
    const isCsv = name.endsWith(".csv")
    const isJson = name.endsWith(".json")

    if (!isCsv && !isJson) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a .csv or .json file." },
        { status: 415 },
      )
    }

    const text = await file.text()

    let rows: Record<string, unknown>[]

    if (isCsv) {
      const result = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim(),
      })
      if (result.errors.length > 0 && result.data.length === 0) {
        return NextResponse.json(
          { error: `Could not parse CSV: ${result.errors[0].message}` },
          { status: 422 },
        )
      }
      rows = result.data
    } else {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: "Invalid JSON file." }, { status: 422 })
      }
      rows = normalizeJson(parsed)
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "The file contains no records." }, { status: 422 })
    }

    const analysis = analyzeRows(rows, file.name, isCsv ? "csv" : "json")
    return NextResponse.json({ analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze the file."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
