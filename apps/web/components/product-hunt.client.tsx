"use client"

import { useTheme } from "next-themes"

export const NeutralBadge = () => (
  <a
    href="https://www.producthunt.com/posts/21st-dev-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-21st&#0045;dev&#0045;2"
    target="_blank"
  >
    <img
      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=771481&theme=neutral"
      alt="21st&#0046;dev - Github&#0032;&#0043;&#0032;Pinterest&#0032;to&#0032;make&#0032;your&#0032;AI&#0032;websites&#0032;look&#0032;beautiful | Product Hunt"
      style={{ width: 250, height: 54 }}
      width={250}
      height={54}
    />
  </a>
)

export const ProductOfTheDayBadge = () => (
  <a
    href="https://www.producthunt.com/posts/21st-dev-2?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-21st&#0045;dev&#0045;2"
    target="_blank"
  >
    <img
      src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=771481&theme=neutral&period=daily&t=1736729396654"
      alt="21st&#0046;dev - Github&#0032;&#0043;&#0032;Pinterest&#0032;to&#0032;make&#0032;your&#0032;AI&#0032;websites&#0032;look&#0032;beautiful | Product Hunt"
      style={{ width: "250px", height: "54px" }}
      width="250"
      height="54"
    />
  </a>
)

const DarkBadge = () => (
  <a
    href="https://www.producthunt.com/posts/21st-dev-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-21st&#0045;dev&#0045;2"
    target="_blank"
  >
    <img
      src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=771481&theme=dark"
      alt="21st&#0046;dev - Github&#0032;&#0043;&#0032;Pinterest&#0032;to&#0032;make&#0032;your&#0032;AI&#0032;websites&#0032;look&#0032;beautiful | Product Hunt"
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
