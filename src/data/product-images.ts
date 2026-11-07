// Each product's picture for its card, with alt text that says what the picture shows.
import type { ImageMetadata } from "astro"
import sheets from "../assets/products/sheets-converter.png"
import purchaserow from "../assets/products/purchaserow-order.png"
import foodSafety from "../assets/food-safety/app-dashboard.webp"
import dental from "../assets/dental/dental-today.webp"
import mealIcon from "../assets/products/meal-planner-icon.png"

export const productImages: Record<string, { src: ImageMetadata; alt: string; kind: "screen" | "icon" }> = {
  "sheets-converter": { src: sheets, kind: "screen", alt: "The Sheets Converter home page: “Bank statements to Excel”, an upload box and the line “checked against the printed balances”." },
  purchaserow: { src: purchaserow, kind: "screen", alt: "PurchaseRow reading a sample purchase order line by line: item, UPC, quantity, unit price and amount, with the order total and the controls for ship date, carrier and quantities shipped." },
  "food-safety": { src: foodSafety, kind: "screen", alt: "The Food Safety Logbook dashboard for a sample bakery: today’s checks on time, late, out of range and still to do." },
  "dental-logbook": { src: dental, kind: "screen", alt: "The Dental Logbook prototype’s Today screen for a sample office: the items due on three sterilizers." },
  "meal-planner": { src: mealIcon, kind: "icon", alt: "The meal planner’s app icon: a white bowl with two leaves on green." },
}
