import { Dock, Box } from "lucide-react"

type NavigationItem = {
  title: string
  href: string
  isNew?: boolean
}

type NavigationSection = {
  title: string
  icon: any
  items: NavigationItem[]
  isNew?: boolean
}

const landingPageSections: NavigationItem[] = [
  { title: "Announcements", href: "/s/announcement" },
  { title: "Backgrounds", href: "/s/background" },
  { title: "Borders", href: "/s/border" },
  { title: "Call to Action", href: "/s/call-to-action" },
  { title: "Clients", href: "/s/clients" },
  { title: "Comparison", href: "/s/comparison" },
  { title: "Docks", href: "/s/dock" },
  { title: "Features", href: "/s/features" },
  { title: "Footer", href: "/s/footer" },
  { title: "Hero", href: "/s/hero" },
  { title: "Images", href: "/s/image" },
  { title: "Maps", href: "/s/map" },
  { title: "Navigation Menus", href: "/s/navbar-navigation" },
  { title: "Pricing", href: "/s/pricing-section" },
  { title: "Scroll Area", href: "/s/scroll-area" },
  { title: "Testimonials", href: "/s/testimonials" },
  { title: "Text", href: "/s/text" },
  { title: "Video", href: "/s/video" },
].sort((a, b) => a.title.localeCompare(b.title))

const uiComponents: NavigationItem[] = [
  { title: "Accordion", href: "/s/accordion" },
  { title: "AI Chat", href: "/s/ai-chat", isNew: true },
  { title: "Alert", href: "/s/alert" },
  { title: "Avatar", href: "/s/avatar" },
  { title: "Badge", href: "/s/badge" },
  { title: "Button", href: "/s/button" },
  { title: "Calendar", href: "/s/calendar", isNew: true },
  { title: "Card", href: "/s/card" },
  { title: "Carousel", href: "/s/carousel" },
  { title: "Checkbox", href: "/s/checkbox" },
  { title: "Date Picker", href: "/s/date-picker", isNew: true },
  { title: "Dialog / Modal", href: "/s/modal-dialog" },
  { title: "Dropdown", href: "/s/dropdown" },
  { title: "Empty State", href: "/s/empty-state" },
  { title: "File Tree", href: "/s/file-tree" },
  { title: "File Upload", href: "/s/upload-download" },
  { title: "Form", href: "/s/form", isNew: true },
  { title: "Icons", href: "/s/icons" },
  { title: "Input", href: "/s/input" },
  { title: "Link", href: "/s/link" },
  { title: "Menu", href: "/s/menu" },
  { title: "Notification", href: "/s/notification", isNew: true },
  { title: "Numbers", href: "/s/number" },
  { title: "Pagination", href: "/s/pagination" },
  { title: "Popover", href: "/s/popover", isNew: true },
  { title: "Radio Group", href: "/s/radio-group" },
  { title: "Sidebar", href: "/s/sidebar" },
  { title: "Sign In", href: "/s/sign-in" },
  { title: "Sign up", href: "/s/registration-signup" },
  { title: "Select", href: "/s/select" },
  { title: "Slider", href: "/s/slider" },
  { title: "Spinner Loader", href: "/s/spinner-loader", isNew: true },
  { title: "Tables", href: "/s/table" },
  { title: "Tags", href: "/s/chip-tag" },
  { title: "Tabs", href: "/s/tab" },
  { title: "Text Area", href: "/s/textarea" },
  { title: "Toast", href: "/s/toast" },
  { title: "Toggle", href: "/s/toggle" },
  { title: "Tooltip", href: "/s/tooltip" },
].sort((a, b) => a.title.localeCompare(b.title))

export const sections: NavigationSection[] = [
  {
    title: "Landing Pages",
    icon: Dock,
    items: landingPageSections,
  },
  {
    title: "UI elements",
    icon: Box,
    items: uiComponents,
  },
]
