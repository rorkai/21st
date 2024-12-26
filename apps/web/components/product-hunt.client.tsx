"use client"

import { useTheme } from "next-themes"
import { Button } from "./ui/button"

const NeutralBadge = () => (
  <a
    href="https://www.producthunt.com/posts/21st-dev?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-21st&#0045;dev"
    target="_blank"
  >
    <img
      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=736237&theme=neutral"
      alt="21st&#0046;dev - Marketplace&#0032;for&#0032;beautiful&#0032;UI&#0032;components&#0032;based&#0032;on&#0032;shadcn&#0032;CLI | Product Hunt"
      style={{ width: "250px", height: "54px" }}
      width="250"
      height="54"
    />
  </a>
)

const DarkBadge = () => (
  <a
    href="https://www.producthunt.com/posts/21st-dev?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-21st&#0045;dev"
    target="_blank"
  >
    <img
      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=736237&theme=dark"
      alt="21st&#0046;dev - Marketplace&#0032;for&#0032;beautiful&#0032;UI&#0032;components&#0032;based&#0032;on&#0032;shadcn&#0032;CLI | Product Hunt"
      style={{ width: "250px", height: "54px" }}
      width="250"
      height="54"
    />
  </a>
)

export function ProductHuntBadge() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  return isDark ? <DarkBadge /> : <NeutralBadge />
}
