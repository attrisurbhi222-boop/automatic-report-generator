"use client"

import { useCallback, useRef, useState } from "react"
import {
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  X,
  FileCheck2,
  Loader2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/analysis"

const ACCEPTED = [".csv", ".json"]
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot).toLowerCase()
}

export function UploadZone({
  onAnalyzed,
}: {
  onAnalyzed: (analysis: AnalysisResult) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const validateAndSet = useCallback((incoming: File | undefined | null) => {
    setError(null)
    if (!incoming) return
    const ext = extensionOf(incoming.name)
    if (!ACCEPTED.includes(ext)) {
      setError("Unsupported file type. Please upload a .csv or .json file.")
      return
    }
    if (incoming.size > MAX_BYTES) {
      setError("File is too large. The maximum size is 10 MB.")
      return
    }
    setFile(incoming)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (isProcessing) return
      validateAndSet(e.dataTransfer.files?.[0])
    },
    [validateAndSet, isProcessing],
  )

  const clear = useCallback(() => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!file) return
    setError(null)
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/analyze", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to analyze the file.")
      }
      onAnalyzed(data.analysis as AnalysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setIsProcessing(false)
    }
  }, [file, onAnalyzed])

  const ext = file ? extensionOf(file.name) : ""

  return (
    <div className="w-full">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-14 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl gradient-brand text-primary-foreground shadow-md">
            <Loader2 className="size-8 animate-spin" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold text-foreground">Analyzing your data…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Parsing records and computing summary statistics.
          </p>
          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full gradient-brand" />
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a CSV or JSON file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card px-6 py-14 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/60 hover:bg-muted/40",
          )}
        >
          <span
            className={cn(
              "mb-4 flex size-16 items-center justify-center rounded-2xl gradient-brand text-primary-foreground shadow-md transition-transform duration-200",
              isDragging ? "scale-110" : "group-hover:scale-105",
            )}
          >
            <UploadCloud className="size-8" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold text-foreground">
            {isDragging ? "Drop your file to begin" : "Drag & drop your data file here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or <span className="font-medium text-primary">browse</span> to choose a file
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              <FileSpreadsheet className="size-3.5" aria-hidden="true" /> CSV
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              <FileJson className="size-3.5" aria-hidden="true" /> JSON
            </span>
            <span>up to 10 MB</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="sr-only"
            onChange={(e) => validateAndSet(e.target.files?.[0])}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {file && !isProcessing && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
              {ext === ".json" ? (
                <FileJson className="size-5 text-primary" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {ext.replace(".", "").toUpperCase()} · {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs font-medium text-primary sm:inline-flex">
              <FileCheck2 className="size-4" aria-hidden="true" /> Ready
            </span>
            <button
              type="button"
              onClick={clear}
              aria-label="Remove file"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!file || isProcessing}
        onClick={handleGenerate}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all",
          file && !isProcessing
            ? "gradient-brand text-primary-foreground shadow-md hover:scale-[1.01]"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="size-4" aria-hidden="true" /> Generate Report
          </>
        )}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Your file is parsed securely on the server — nothing is stored.
      </p>
    </div>
  )
}
