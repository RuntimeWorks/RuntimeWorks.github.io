// The Dental Logbook library: guides, free tools and state pages, one Markdown file each (moved from the old site by
// scripts/migrate-legacy.mjs). The schema is checked at every build, so a missing title or a malformed sheet fails it.
import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const column = z.object({ header: z.string(), label: z.string() })
const table = z.object({
  caption: z.string(),
  columns: z.array(column).min(1),
  // A number of blank rows, or each row's printed cells (null where the row has a field to fill).
  rows: z.union([z.number().int().positive(), z.array(z.array(z.string().nullable()))]),
})
export const sheet = z.object({
  title: z.string().optional(),
  // The paper the old page asked for in its @page rule.
  orientation: z.enum(["portrait", "landscape"]),
  fields: z.array(z.object({ label: z.string(), value: z.string().optional() })),
  notes: z.array(z.string()),
  tables: z.array(table).min(1),
  footer: z.array(z.string()).optional(),
  // Screen-only lines (the old page hid them in print), such as "Scroll the table sideways".
  hints: z.array(z.string()).optional(),
})

const page = z.object({
  title: z.string(),
  description: z.string(),
  legacy: z.string(),
  heading: z.string(),
  kicker: z.string().optional(),
  byline: z.string().optional(),
  lead: z.array(z.string()).optional(),
  facts: z.array(z.string()).optional(),
  answer: z.array(z.string()).optional(),
  note: z.string().optional(),
  cta: z.object({ heading: z.string(), text: z.string(), link: z.string() }).optional(),
  sheets: z.array(sheet).optional(),
})

const library = (kind: string) => defineCollection({ loader: glob({ pattern: "*.md", base: `./src/content/${kind}` }), schema: page })

export const collections = { guides: library("guides"), tools: library("tools"), states: library("states") }
