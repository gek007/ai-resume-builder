import { Source_Sans_3 } from "next/font/google";

// Self-hosted by Next, so the live preview and the server-printed PDF use the
// exact same typeface (headless Chromium has no system fonts to fall back on).
export const resumeFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});
