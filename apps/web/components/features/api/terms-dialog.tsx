"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TermsDialogProps {
  open: boolean
  onAccept: () => void
  onClose: () => void
}

export function TermsDialog({ open, onAccept, onClose }: TermsDialogProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    const content = contentRef.current
    if (!content) return

    const scrollPercentage =
      content.scrollTop / (content.scrollHeight - content.clientHeight)
    if (scrollPercentage >= 0.99 && !hasReadToBottom) {
      setHasReadToBottom(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col gap-0 p-0 max-h-[calc(100vh-100px)] rounded-lg sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            21st.dev API Terms of Use
          </DialogTitle>
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
          >
            <DialogDescription asChild>
              <div className="px-6 py-4">
                <div className="space-y-4 [&_strong]:font-semibold [&_strong]:text-foreground">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p>
                        <strong>1. Purpose and Acceptable Use</strong>
                      </p>
                      <p>
                        The 21st.dev API ("API") is provided to allow authorized
                        users to search for, discover, and integrate components
                        with their projects. The API is intended solely for
                        real-time searches and installations of components, with
                        all dependencies automatically included.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>2. API Key Use</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          The API key provided to you is personal,
                          non-transferable, and cannot be shared with any third
                          party.
                        </li>
                        <li>
                          You must implement strict access controls to ensure
                          your API key is only used within authorized
                          environments (e.g., server-side only or through secure
                          client applications).
                        </li>
                        <li>
                          Storing or caching API responses is prohibited, except
                          for temporary use (e.g., caching for up to 5 minutes
                          to reduce server load). Data must not be stored
                          persistently.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>3. Prohibited Activities</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          You are strictly prohibited from using the API to
                          scrape, bulk download, or store any data, including
                          but not limited to component metadata, links, or
                          installation code.
                        </li>
                        <li>
                          Decompiling, reverse engineering, or otherwise
                          attempting to extract the source code of any
                          components or the API itself is forbidden.
                        </li>
                        <li>
                          You may not redistribute, rehost, or otherwise make
                          the API responses or associated component code
                          publicly available.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>4. Data Usage and Ownership</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          API consumers are not permitted to store component
                          code or metadata locally beyond what is necessary for
                          immediate installation and usage within their
                          application.
                        </li>
                        <li>
                          All API responses, including component metadata and
                          links, are subject to the licensing terms specified
                          for each component. You are responsible for ensuring
                          compliance.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>5. Rate Limits and Monitoring</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          The API is subject to rate limits, which will be
                          communicated at the time of your onboarding. Exceeding
                          these limits may result in temporary or permanent
                          suspension of your access.
                        </li>
                        <li>
                          All API usage is monitored to detect and prevent
                          unauthorized use. Suspicious activity, including
                          scraping or excessive requests, will result in
                          immediate termination of access.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>6. Security Requirements</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          API keys must be stored securely and not exposed in
                          client-side code, public repositories, or other
                          insecure environments.
                        </li>
                        <li>
                          All API requests must include the API key as part of
                          the request headers. Unauthorized requests will be
                          blocked.
                        </li>
                        <li>
                          All communication with the API must occur over HTTPS
                          to protect data in transit.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>7. Enforcement and Penalties</strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          Violation of these terms may result in immediate
                          suspension or permanent revocation of API access.
                        </li>
                        <li>
                          Unauthorized use of the API, including scraping or
                          storing data in violation of these terms, may result
                          in legal action to protect our intellectual property.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>
                          8. Guidelines for Component Installation
                        </strong>
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>
                          API consumers must use the installation links provided
                          by the API to install components, ensuring all
                          dependencies are properly included.
                        </li>
                        <li>
                          Modifying, forking, or creating derivative works based
                          on the components accessed via the API is prohibited
                          unless explicitly allowed by the component's license.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>9. Support and Contact</strong>
                      </p>
                      <p>
                        For support, questions, or to report potential misuse,
                        please contact us at{" "}
                        <a
                          href="mailto:support@21st.dev"
                          className="text-primary hover:underline"
                        >
                          serafimcloud@gmail.com
                        </a>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p>
                        <strong>10. Changes to Terms</strong>
                      </p>
                      <p>
                        21st.dev reserves the right to update these terms at any
                        time. Continued use of the API constitutes acceptance of
                        the updated terms.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        By using the 21st.dev API, you agree to adhere to these
                        terms and any applicable laws and regulations. Failure
                        to comply may result in the suspension or termination of
                        your API access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="border-t border-border px-6 py-4 sm:items-center gap-3 sm:gap-[inherit]">
          {!hasReadToBottom && (
            <span className="grow text-xs text-muted-foreground max-sm:text-center">
              Read all terms before accepting.
            </span>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onAccept} disabled={!hasReadToBottom}>
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
