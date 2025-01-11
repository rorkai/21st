import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy – 21st.dev",
  description: "Privacy policy for 21st.dev",
}

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-6 md:py-10">
      <div className="prose dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>

        <p className="lead">Last updated: 12/25/2024</p>

        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy explains how 21st.dev ("we", "our", or "us"),
          operated by Serafim Korablev, collects and uses information through
          our website and services.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Anonymous Usage Data</h3>
        <p>
          We collect anonymous usage data to improve our services and understand
          how users interact with 21st.dev. This may include:
        </p>
        <ul>
          <li>Pages visited and features used</li>
          <li>
            Technical information such as browser type and device information
          </li>
          <li>Usage patterns and interaction with our components</li>
        </ul>

        <h3>2.2 Newsletter Subscription</h3>
        <p>
          If you opt in to receive our newsletter, we collect and store your
          email address. This is only done with your explicit consent when you:
        </p>
        <ul>
          <li>Subscribe through our website</li>
          <li>Sign up for updates about new components</li>
          <li>Register for an account</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for:</p>
        <ul>
          <li>Improving our component library and services</li>
          <li>Sending newsletters and updates (only to subscribed users)</li>
          <li>Analyzing usage patterns to enhance user experience</li>
          <li>Maintaining and optimizing our platform</li>
        </ul>

        <h2>4. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Unsubscribe from our newsletter at any time</li>
          <li>Request information about your data we store</li>
          <li>Request deletion of your email from our database</li>
        </ul>

        <h2>5. Contact Information</h2>
        <p>
          For any privacy-related questions or concerns, please contact:
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
