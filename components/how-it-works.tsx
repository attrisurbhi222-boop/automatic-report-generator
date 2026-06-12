import { UploadCloud, Sparkles, FileBarChart } from "lucide-react"

const steps = [
  {
    icon: UploadCloud,
    title: "Upload your data",
    desc: "Drop in a CSV or JSON file. Your data is parsed securely on the server.",
  },
  {
    icon: Sparkles,
    title: "Automatic analysis",
    desc: "We detect columns, summarize numeric fields, and surface key trends instantly.",
  },
  {
    icon: FileBarChart,
    title: "Download your report",
    desc: "Preview an interactive dashboard, then export a clean, formatted PDF.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          From raw data to report in three steps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          No spreadsheets, no formulas. Insightly turns your file into shareable
          insights automatically.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="absolute right-4 top-4 text-5xl font-bold text-muted/60 select-none">
              {i + 1}
            </div>
            <span className="flex size-12 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-110">
              <step.icon className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
