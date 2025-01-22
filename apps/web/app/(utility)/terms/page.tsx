import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service – 21st.dev",
  description: "Terms of service for 21st.dev",
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-none">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>

          <div className="text-sm text-muted-foreground mb-12">Last updated: 12/25/2024</div>

          <div className="space-y-16">
            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">1. Introduction</h2>
              <p className="text-muted-foreground leading-7">
                These Terms of Service ("Terms") govern your access to and use of
                21st.dev ("we", "our", or "us"), operated by Serafim Korablev. By
                accessing or using 21st.dev, you agree to be bound by these Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">2. Intellectual Property Rights</h2>
              <p className="text-muted-foreground leading-7">
                All code, content, and materials published on 21st.dev, including but
                not limited to components, documentation, and related assets, are the
                sole and exclusive property of their respective authors and 21st.dev.
                Users are granted access to view and use the content solely through
                the official 21st.dev platform in accordance with these Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">3. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-4 leading-7">Users are strictly prohibited from:</p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Scraping or automatically collecting data from 21st.dev through web
                  scraping, bots, crawlers, or any other automated means without
                  explicit written consent from 21st.dev</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Using any content, code, or data from 21st.dev to train artificial
                  intelligence models, machine learning systems, or similar
                  technologies without explicit written consent from 21st.dev</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Redistributing, selling, or licensing any content from 21st.dev
                  without authorization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Copying and redistributing components originally published on
                  21st.dev to other websites, social media platforms, or any other
                  medium without providing a clear and visible link back to the
                  original component page on 21st.dev</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Attempting to circumvent any technical measures implemented to
                  protect our content</span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">4. Enforcement</h2>
              <p className="text-muted-foreground mb-4 leading-7">We reserve the right to:</p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Take appropriate legal action against violations of these Terms</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Terminate or suspend access to our services for violations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Remove or disable access to any content that violates these Terms</span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">5. Changes to Terms</h2>
              <p className="text-muted-foreground leading-7">
                We reserve the right to modify these Terms at any time. Changes will
                be effective immediately upon posting on 21st.dev. Your continued use
                of the platform after changes constitutes acceptance of the modified
                Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">6. Contact Information</h2>
              <p className="text-muted-foreground leading-7">
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
                Email: serafimcloud@gmail.com
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
