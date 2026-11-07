// Each product's cover for its card: the product's own front page (founder, 2026-11-07: "really professional
// thumbnails for all products"; PurchaseRow's own site "looked much better"). Sheets Converter and PurchaseRow: the
// first screen of their own sites (1280 x 800 at 2x). The three that live on this site: the navy opening band of their
// page, made by scripts/covers.mjs (npm run covers). All are 16:10.
import type { ImageMetadata } from "astro"
import sheets from "../assets/products/sheets-converter.png"
import purchaserow from "../assets/products/purchaserow.png"
import foodSafety from "../assets/products/cover-food-safety.png"
import dental from "../assets/products/cover-dental-logbook.png"
import meal from "../assets/products/cover-meal-planner.png"

export const productImages: Record<string, { src: ImageMetadata; alt: string }> = {
  "sheets-converter": { src: sheets, alt: "The Sheets Converter home page: “Bank statements to Excel”, an upload box and the line “checked against the printed balances”." },
  purchaserow: { src: purchaserow, alt: "The PurchaseRow site: “EDI for small suppliers who sell to big retailers”, with one line of a retailer’s order read in plain words." },
  "food-safety": { src: foodSafety, alt: "The Food Safety Logbook page: “Records ready for your inspector, every shift”, beside the owner’s dashboard with sample data." },
  "dental-logbook": { src: dental, alt: "The Dental Logbook page: “Sterilization records done properly, found in seconds”, beside a summary of the product: in development, a free pilot for dental offices." },
  "meal-planner": { src: meal, alt: "The meal planner page: “A week of meals, planned to your budget”, beside the app’s icon." },
}
