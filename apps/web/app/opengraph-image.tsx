/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "21st.dev - The NPM for Design Engineers"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Helper function to generate sparkle positions
const generateSparkles = (count: number) => {
  const sparkles = []
  for (let i = 0; i < count; i++) {
    sparkles.push({
      left: `${Math.random() * 100}%`,
      top: `${50 + Math.random() * 50}%`,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.2 + Math.random() * 0.5,
    })
  }
  return sparkles
}

export default async function Image() {
  const sparkles = generateSparkles(40)

  return new ImageResponse(
    (
      <div
        style={{
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Inter",
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
          }}
        >
          {/* Base glow */}
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              width: "100%",
              height: "800px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 100%)",
              filter: "blur(80px)",
            }}
          />
          {/* Middle glow */}
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              width: "70%",
              height: "500px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 100%)",
              filter: "blur(55px)",
            }}
          />
          {/* Center intense glow */}
          <div
            style={{
              position: "absolute",
              bottom: "0%",
              width: "40%",
              height: "200px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 100%)",
              filter: "blur(30px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "0%",
              width: "40%",
              height: "200px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 100%)",
              filter: "blur(30px)",
            }}
          />
        </div>

        {/* Content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo and text */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "80px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "white",
                marginRight: "20px",
              }}
            />
            <div
              style={{
                fontSize: "56px",
                color: "white",
                fontWeight: "700",
                letterSpacing: "-0.02em",
              }}
            >
              21st.dev
            </div>
          </div>

          {/* Main heading with gradient */}
          <div
            style={{
              fontSize: "64px",
              background:
                "linear-gradient(to bottom right, white 30%, rgba(255,255,255,0.4))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontWeight: "800",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.15,
              marginTop: "30px",
              letterSpacing: "-0.02em",
              WebkitTextFillColor: "transparent",
            }}
          >
            Discover, share, and craft perfect UI components with top design
            engineers
          </div>
        </div>

        {/* Sparkles */}
        {sparkles.map((sparkle, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sparkle.left,
              top: sparkle.top,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              background: "white",
              borderRadius: "50%",
              opacity: sparkle.opacity,
            }}
          />
        ))}
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await fetch(
            new URL(
              "https://fonts.cdnfonts.com/s/19795/Inter-Bold.woff",
              import.meta.url,
            ),
          ).then((res) => res.arrayBuffer()),
          weight: 700,
          style: "normal",
        },
      ],
    },
  )
}
