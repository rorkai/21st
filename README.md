# 🚀 Welcome to 21st.dev!

**[21st.dev](https://21st.dev)** is your go-to open-source community registry for **React UI components**! Whether you're a developer, designer, or just someone who loves building beautiful interfaces, 21st.dev is the place to **publish, discover, and install** minimal, modern, and reusable React components powered by **Tailwind CSS** and **Radix UI**.

Inspired by the amazing [shadcn/ui](https://ui.shadcn.com/), we're here to make building UIs faster, easier, and more fun. 🎉

[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white&style=for-the-badge)](https://discord.gg/Qx4rFunHfm)

---

## 👥 Community

We're building more than just a component registry – we're building a community of developers who love creating beautiful UIs. Here's how you can get involved:

- **Join our [Discord](https://discord.gg/Qx4rFunHfm)** – Get help, share your work, and chat with other developers
- **Follow us on [X/Twitter](https://x.com/serafimcloud)** – Stay updated with the latest features and components
- **Star us on [GitHub](https://github.com/serafimcloud/21st)** – Support the project and follow our progress
- **Share your components** – Help others by contributing your UI components
- **Give feedback** – Your input shapes the future of 21st.dev

---

## 🌟 Why 21st.dev?

- **Open Source & Community-Driven**: Built by developers, for developers. Everyone is welcome to contribute!
- **Minimal & Modern**: Components are lightweight, customizable, and designed with Tailwind and Radix UI.
- **Easy to Use**: Install any component with a single `npx shadcn` command.
- **Multiple Demos**: Each component can have multiple demos with previews and videos.
- **Extensible**: Add your own components, themes, and dependencies effortlessly.
- **TypeScript First**: Full type support out of the box.

---

## 🛠️ Publish Your Component in 1 Minute!

Yes, you read that right—**1 minute**! 🕒  
Publishing your React component is as easy as pie. Just head over to our [publish page](https://21st.dev) and share your creation with the world.

### Review Process

When you publish a component, it follows this journey:

1. **Initial State** (`on_review`) - Component is available via direct link and awaiting review
2. **Posted State** (`posted`) - Component has passed review and is available on your profile and via direct link
3. **Featured State** (`featured`) - Component is featured on the homepage and in public listings

I ([Serafim](https://x.com/serafimcloud)) personally review each component to ensure it meets our quality standards before featuring it.

### Quality Guidelines

To get your component featured, ensure it follows these key principles:

1. **Visual Quality**

   - Component should be visually polished and provide real value to the community
   - Follow modern UI/UX practices

2. **Code Structure**

   - Follow the shadcn/ui pattern of separating component logic from demo content
   - Component file should contain only the reusable functionality
   - Demo file should showcase the component through props, not hardcoded content

3. **Theming**
   - Use CSS variables from shadcn's theme system (see `globals.css`)
   - Support both light and dark modes out of the box
   - Use the proper color variables (e.g., `hsl(var(--background))`)

Remember: Quality over quantity! We prioritize well-crafted, reusable components that follow these guidelines.

### File Structure:

```
your-component/                # How to organize your files
├── code.tsx                  # Main component
├── tailwind.config.js        # Optional Tailwind config
├── globals.css              # Optional global styles
└── demos/                    # Each component can have multiple demos
    ├── default/             # Primary demo (required)
    │   ├── code.demo.tsx    # Demo implementation
    │   ├── preview.png      # Static preview image
    │   └── video.mp4        # Optional demo video
    └── advanced/            # Additional demos (optional)
        ├── code.demo.tsx
        ├── preview.png
        └── video.mp4

# Files are stored in Cloudflare R2 under:
# components-code/{user_id}/{component_slug}/...
```

### What We Support:

- **Pure React Components** – Build with React, no fuss.
- **Next.js Client Components** – We've got you covered (server-side rendering coming soon!).
- **TypeScript** – Because type safety is ❤️.
- **Tailwind Themes** – Customize to your heart's content.
- **Global CSS Styles** – Add your own flair.
- **Radix UI** – Accessible and unstyled primitives.
- **Any npm Dependencies** – Thanks to [Sandpack](https://sandpack.codesandbox.io/).
- **Internal Dependencies** – Use any component from our registry as a dependency.
- **Multiple Demos** – Showcase different use cases and variations.
- **Preview Images & Videos** – Make your component shine.

**Pro Tip**: We encourage TypeScript components. JavaScript is cool too, but untested for now. 😉

---

## ⚡ Install a Component in Seconds!

Found a component you love on [21st.dev](https://21st.dev)? Installing it is a breeze. Just copy the `npx shadcn` command and run it in your project's root folder.

For example, to install the `shadcn/ui/accordion` component, run:

```bash
npx shadcn@latest add "https://21st.dev/r/shadcn/accordion"
```

This command will:

- Create all necessary files for the component and its dependencies.
- Extend your Tailwind theme automatically.
- Set up any required global styles.

**Why use the command?**  
While you can copy-paste code directly from the website, using `npx shadcn` ensures you get all the files and dependencies without missing a beat. It's the recommended way to go! 🚀

---

## 🏗 Architecture

The project uses a modern stack:

- **Frontend**: Next.js 14
- **Database**: Supabase for metadata and user data
- **Authentication**: Clerk
- **File Storage**: Cloudflare R2
- **Analytics**: Amplitude

---

## 🛠️ Contributing to 21st.dev

We're thrilled you want to contribute! Whether you're a seasoned developer or just starting out, there's a place for you here. Let's get you set up:

### 🛠️ Prerequisites

Before diving in, make sure you have:

- A **Supabase** account
- A **Clerk** account
- A **Cloudflare R2** account

### 🚀 Setup Guide

1. **Fork & Clone**: Fork the repository and clone it locally. We recommend using [Cursor](https://cursor.com) if you're non-technical.

2. **Install Dependencies**: We're big fans of `pnpm`! Run:

   ```bash
   pnpm install
   ```

3. **Environment Setup**: Create a `.env.local` in `apps/web` with:

   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://*****
   NEXT_PUBLIC_SUPABASE_KEY=*****
   SUPABASE_SERVICE_ROLE_KEY=*****

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=*****
   CLERK_SECRET_KEY=*****
   CLERK_WEBHOOK_SECRET=*****

   # Cloudflare R2
   NEXT_PUBLIC_CDN_URL=https://*****
   R2_ACCESS_KEY_ID=*****
   R2_SECRET_ACCESS_KEY=*****
   NEXT_PUBLIC_R2_ENDPOINT=https://*****

   # Other
   NEXT_PUBLIC_APP_URL=https://21st.dev
   NEXT_PUBLIC_AMPLITUDE_API_KEY=*****
   ```

4. **Start Development**:

   ```bash
   pnpm dev
   ```

5. **Open a PR**: Once you're done, open a PR to the `main` branch. We can't wait to see what you've built! 🎉

---

## 👥 Team

The project was developed by [@serafimcloud](https://x.com/serafimcloud), with significant contributions from [@daniel_dhawan](https://x.com/daniel_dhawan) and [@garrrikkotua](https://x.com/garrrikkotua).

---

## 🙏 Acknowledgments

This project wouldn't be possible without the incredible work of:

- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindui.com/)
- [Sandpack by CodeSandbox](https://sandpack.codesandbox.io/)
- [Supabase](https://supabase.com)
- [Vercel](https://vercel.com)
- [Clerk](https://clerk.com)
- [Cloudflare](https://cloudflare.com)
- [Cursor](https://cursor.com)
- [Claude 3.5 Sonnet by Anthropic](https://anthropic.com/)
- [MagicUI](https://magicui.design)

And, of course, **YOU**—our amazing open-source contributors! ❤️

---

## 🚀 Let's Build the Future Together!

Ready to dive in? Start exploring, publishing, and contributing today. Let's make 21st.dev the best place for React UI components on the web. Happy coding! 🎉

## 📋 Component Guidelines

We maintain high quality standards for components that appear on the homepage and in public listings. While all published components are immediately available via direct links, they go through a review process before being featured publicly.

### Review Process

When you publish a component, it follows this journey:

1. **Initial State** (`on_review`) - Component is available via direct link and awaiting review
2. **Posted State** (`posted`) - Component has passed review and is available on your profile and via direct link
3. **Featured State** (`featured`) - Component is featured on the homepage and in public listings

I ([Serafim](https://x.com/serafimcloud)) personally review each component to ensure it meets our quality standards before featuring it. This helps maintain a high-quality collection of components that truly benefit the community.

### Quality Standards

To ensure your component gets featured, follow these guidelines:

1. **Visual Design**

   - Component should be visually polished and provide value to the community
   - Follow modern UI/UX practices
   - Support both light and dark themes
   - Use consistent spacing and sizing

2. **Code Structure**

   - Follow the shadcn/ui pattern of separating component logic from demo content
   - Component file should contain only the reusable functionality
   - Demo file should showcase the component with realistic content
   - Use props for customization and content injection

3. **Theming**

   - Use CSS variables from shadcn's theme system (see `globals.css`)
   - Support both light and dark modes out of the box
   - Use `hsl` variables for colors (e.g., `hsl(var(--background))`)
   - Follow the naming convention for CSS variables

4. **Accessibility**

   - Include proper ARIA attributes
   - Support keyboard navigation
   - Maintain sufficient color contrast
   - Test with screen readers

5. **Documentation**

   - Provide clear prop documentation
   - Include usage examples
   - Document any required dependencies
   - Add helpful comments for complex logic

6. **Best Practices**
   - Keep components focused and single-purpose
   - Minimize external dependencies
   - Ensure responsive behavior
   - Follow TypeScript best practices
   - Include meaningful default props

Remember: Quality over quantity! We'd rather have fewer, well-crafted components than many that don't meet our standards.

---
