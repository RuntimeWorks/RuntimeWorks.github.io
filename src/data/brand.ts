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
  // Colour inputs for Radix's palette generator (scripts/gen-tokens.ts), all from the brand theme below: accent = the
  // harbour navy; gray = the theme's third ink (a blue grey); light background = paper; dark background = ink.
  colors: { accent: "#0F2B47", gray: "#56616D", backgroundLight: "#FBF8F2", backgroundDark: "#0C1723", markSand: "#EEE4D1" },
  // The brand theme the founder approved, read from the old site's own :root (git 5b0fcac, index.html): navy
  // "harbour" bands with sand text, white cards with soft shadows on paper, sand bands, ink for the footer.
  // Founder, 2026-11-07: "the previous theme of boldsand website looked better, the blue and white stuff". Cards keep
  // the old shadow under a 1 px ambient layer instead of the old 1 px outline (Material elevation: key and ambient
  // shadows; taste-skill "outlined-box").
  theme: {
    harbour: "#0F2B47", harbour2: "#173A5E", onHarbour: "#EDE5D4", onHarbour2: "#B4C1CF",
    sand: "#EEE4D1", sand2: "#E2D4B8", paper: "#FBF8F2", white: "#FFFFFF", ink: "#0C1723", pass: "#17663F",
    shadowCard: "0 1px 2px rgba(12,23,35,.08), 0 18px 40px -28px rgba(12,23,35,.35)", shadowCardHover: "0 1px 2px rgba(12,23,35,.08), 0 28px 50px -28px rgba(12,23,35,.45)",
    shadowShot: "0 18px 30px -18px rgba(12,23,35,.5)", shadowFrame: "0 40px 70px -30px rgba(4,14,26,.7)",
    radius: "14px", radiusSmall: "10px",
  },
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
