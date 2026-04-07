import { Outfit } from "next/font/google";

/** TailAdmin-style UI font — shared by dashboard and auth. */
export const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
});
