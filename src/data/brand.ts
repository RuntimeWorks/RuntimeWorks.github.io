// The one place the company's facts and its product list live. Pages, the footer, the sitemap and the structured data
// all read from here. Sources for each fact are in projects/boldsand-com/PLAN.md (workspace) §1–§2.

export const brand = {
  name: "Boldsand",
  legalName: "Boldsand Software Inc.",
  url: "https://boldsand.com",
  email: "deya@boldsand.com",
  phone: { display: "226\u2011222\u20114274", tel: "+12262224274" },
  // Registered office, as published in Sheets Converter's terms and the Google Play trader details.
  address: { street: "C 505 University Ave", city: "Charlottetown", region: "PE", regionName: "Prince Edward Island", postal: "C1A 9S3", country: "CA" },
  incorporated: { iso: "2026-08-19", display: "19 August 2026", jurisdiction: "Prince Edward Island, Canada" },
  // Colour inputs for Radix's palette generator (scripts/gen-tokens.ts). accent = the logo's navy; gray = Radix
  // sand step 9; light background = the brand's paper; dark background = Radix's default for custom palettes.
  colors: { accent: "#0F2B47", gray: "#8D8D86", backgroundLight: "#FBF8F2", backgroundDark: "#111111", markSand: "#EEE4D1" },
} as const

export type Status = "Live" | "Pilot open" | "In development"
export type Group = "business" | "consumer"

export interface Product {
  id: string
  name: string
  group: Group
  status: Status
  /** What it does, in one sentence. */
  summary: string
  /** Who it is for. */
  audience: string
  /** Where the card leads. External links open the product's own site. */
  href: string
  cta: string
  external?: boolean
}

export const products: Product[] = [
  {
    id: "sheets-converter",
    name: "Sheets Converter",
    group: "business",
    status: "Live",
    summary: "Turns PDF bank and card statements into Excel, CSV, QuickBooks and Xero files, and checks every row against the statement’s printed balances.",
    audience: "Bookkeepers, accountants and small businesses",
    href: "https://sheetsconverter.com/",
    cta: "Visit sheetsconverter.com",
    external: true,
  },
  {
    id: "purchaserow",
    name: "PurchaseRow",
    group: "business",
    status: "In development",
    summary: "Reads each retailer’s EDI purchase order in plain words, then confirms, ships with GS1 carton labels and invoices it from a browser.",
    audience: "Small suppliers selling to big retailers",
    href: "/purchaserow/",
    cta: "About PurchaseRow",
  },
  {
    id: "food-safety",
    name: "Food Safety Logbook",
    group: "business",
    status: "Pilot open",
    summary: "Temperatures, cleaning and deliveries logged on any phone, with the records ready when the inspector walks in.",
    audience: "Restaurants, bakeries, caterers, grocers and food processors in Atlantic Canada",
    href: "/food-safety/",
    cta: "About the Food Safety Logbook",
  },
  {
    id: "dental-logbook",
    name: "Dental Logbook",
    group: "business",
    status: "In development",
    summary: "Sterilization and safety records for dental offices, with any record found in seconds when an inspector asks.",
    audience: "Dental offices in the United States, then Ontario",
    href: "/dental-logbook/",
    cta: "About the Dental Logbook",
  },
  {
    id: "meal-planner",
    name: "Meal planner",
    group: "consumer",
    status: "In development",
    summary: "Plans a week of meals around your budget, diet and allergies, with one grocery list for the week.",
    audience: "Households on iPhone and Android",
    href: "/meal-planner/",
    cta: "About the meal planner",
  },
]

export const groups: Record<Group, { title: string; label: string }> = {
  business: { title: "For businesses", label: "Business software" },
  consumer: { title: "For people", label: "Apps" },
}
