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
  /** What kind of product it is, in formal terms (shown under the name on the home page's cards). */
  category: string
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
    category: "Bank statement conversion and verification",
    summary: "Converts PDF bank and card statements into Excel, CSV, QuickBooks and Xero files, and checks every row against the balances printed on the statement.",
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
    category: "Electronic data interchange (EDI) for suppliers",
    summary: "Receives retailers’ EDI purchase orders and sends the order acknowledgment, the ship notice with GS1-128 carton labels, and the invoice, from a web browser.",
    audience: "Small suppliers selling to big retailers",
    href: "/purchaserow/",
    cta: "Product overview",
  },
  {
    id: "food-safety",
    name: "Food Safety Logbook",
    group: "business",
    status: "Pilot open",
    category: "Food safety records and inspection reports",
    summary: "Temperature, cleaning and receiving records for food businesses, logged on any phone or tablet and ready when a public health inspector asks.",
    audience: "Restaurants, bakeries, caterers, grocers and food processors in Atlantic Canada",
    href: "/food-safety/",
    cta: "Product overview",
  },
  {
    id: "dental-logbook",
    name: "Dental Logbook",
    group: "business",
    status: "In development",
    category: "Sterilization and infection-control records",
    summary: "Sterilizer load records, spore tests and safety checks for dental offices, designed around CDC, OSHA and EPA guidance and Ontario’s RCDSO standards.",
    audience: "Dental offices in the United States, then Ontario",
    href: "/dental-logbook/",
    cta: "Product overview",
  },
  {
    id: "meal-planner",
    name: "Meal planner",
    group: "consumer",
    status: "In development",
    category: "Meal planning and grocery lists",
    summary: "Plans a household’s week of meals within its budget, diet and allergies, with nutrient values from USDA FoodData Central and one grocery list.",
    audience: "Households on iPhone and Android",
    href: "/meal-planner/",
    cta: "Product overview",
  },
]

export const groups: Record<Group, { title: string; label: string }> = {
  business: { title: "Business software", label: "Business software" },
  consumer: { title: "Consumer apps", label: "Apps" },
}
