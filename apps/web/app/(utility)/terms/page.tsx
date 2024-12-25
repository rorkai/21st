import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service – 21st.dev",
  description: "Terms of service for 21st.dev",
}

export default function TermsOfService() {
  return (
    <div className="container max-w-3xl py-6 md:py-10">
      <div className="prose dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>

        <p className="lead">Last updated: 12/25/2024</p>

        <h2>1. Introduction</h2>
        <p>
          These Terms of Service ("Terms") govern your access to and use of
          21st.dev ("we", "our", or "us"), operated by Serafim Korablev. By
          accessing or using 21st.dev, you agree to be bound by these Terms.
        </p>

        <h2>2. Intellectual Property Rights</h2>
        <p>
          All code, content, and materials published on 21st.dev, including but
          not limited to components, documentation, and related assets, are the
          sole and exclusive property of their respective authors and 21st.dev.
          Users are granted access to view and use the content solely through
          the official 21st.dev platform in accordance with these Terms.
        </p>

        <h2>3. Prohibited Activities</h2>
        <p>Users are strictly prohibited from:</p>
        <ul>
          <li>
            Scraping or automatically collecting data from 21st.dev through web
            scraping, bots, crawlers, or any other automated means without
            explicit written consent from 21st.dev
          </li>
          <li>
            Using any content, code, or data from 21st.dev to train artificial
            intelligence models, machine learning systems, or similar
            technologies without explicit written consent from 21st.dev
          </li>
          <li>
            Redistributing, selling, or licensing any content from 21st.dev
            without authorization
          </li>
          <li>
            Copying and redistributing components originally published on
            21st.dev to other websites, social media platforms, or any other
            medium without providing a clear and visible link back to the
            original component page on 21st.dev
          </li>
          <li>
            Attempting to circumvent any technical measures implemented to
            protect our content
          </li>
        </ul>

        <h2>4. Enforcement</h2>
        <p>We reserve the right to:</p>
        <ul>
          <li>
            Take appropriate legal action against violations of these Terms
          </li>
          <li>Terminate or suspend access to our services for violations</li>
          <li>
            Remove or disable access to any content that violates these Terms
          </li>
        </ul>

        <h2>5. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Changes will
          be effective immediately upon posting on 21st.dev. Your continued use
          of the platform after changes constitutes acceptance of the modified
          Terms.
        </p>

        <h2>6. Contact Information</h2>
        <p>
          For any questions regarding these Terms, please contact:
          <br />
          Serafim Korablev
          <br />
          28 Coates Way
          <br />
          Watford
          <br />
          WD259NS
          <br />
          United Kingdom
          <br />
          Email: serafim@rorkai.com
        </p>
      </div>
    </div>
  )
}
