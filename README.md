# 🚀 Welcome to 21st.dev!

**[21st.dev](https://21st.dev)** is your go-to open-source community registry for **React UI components**! Whether you're a developer, designer, or just someone who loves building beautiful interfaces, 21st.dev is the place to **publish, discover, and install** minimal, modern, and reusable React components powered by **Tailwind CSS** and **Radix UI**. 

Inspired by the amazing [shadcn/ui](https://ui.shadcn.com/), we’re here to make building UIs faster, easier, and more fun. 🎉

---

## 🌟 Why 21st.dev?

- **Open Source & Community-Driven**: Built by developers, for developers. Everyone is welcome to contribute!
- **Minimal & Modern**: Components are lightweight, customizable, and designed with Tailwind and Radix UI.
- **Easy to Use**: Install any component with a single `npx shadcn` command.
- **Extensible**: Add your own components, themes, and dependencies effortlessly.

---

## 🛠️ Publish Your Component in 1 Minute!

Yes, you read that right—**1 minute**! 🕒  
Publishing your React component is as easy as pie. Just head over to our [publish page](https://21st.dev) and share your creation with the world. All you need are two files:

1. `component.tsx` – Your React component.
2. `component.demo.tsx` – A demo showcasing your component in action.

### What We Support:
- **Pure React Components** – Build with React, no fuss.
- **Next.js Client Components** – We’ve got you covered (server-side rendering coming soon!).
- **TypeScript** – Because type safety is ❤️.
- **Tailwind Themes** – Customize to your heart’s content.
- **Global CSS Styles** – Add your own flair.
- **Radix UI** – Accessible and unstyled primitives.
- **Any npm Dependencies** – Thanks to [Sandpack](https://sandpack.codesandbox.io/).
- **Internal Dependencies** – Use any component from our registry as a dependency.

**Pro Tip**: We encourage TypeScript components. JavaScript is cool too, but untested for now. 😉

---

## ⚡ Install a Component in Seconds!

Found a component you love on [21st.dev](https://21st.dev)? Installing it is a breeze. Just copy the `npx shadcn` command and run it in your project’s root folder.  

For example, to install the `shadcn/ui/accordion` component, run:

```bash
npx shadcn@latest add "https://21st.dev/r/shadcn/accordion"
```

This command will:
- Create all necessary files for the component and its dependencies.
- Extend your Tailwind theme automatically.

**Why use the command?**  
While you can copy-paste code directly from the website, using `npx shadcn` ensures you get all the files and dependencies without missing a beat. It’s the recommended way to go! 🚀

---

## 🛠️ Contributing to 21st.dev

We’re thrilled you want to contribute! Whether you’re a seasoned developer or just starting out, there’s a place for you here. Let’s get you set up:

### 🛠️ Prerequisites

Before diving in, make sure you have:
- A **Supabase** account.
- A **Clerk** account.
- **ngrok** or another tunneling software.
- A **Cloudflare R2** account.

### 🚀 Setup Guide

1. **Fork & Clone**: Fork the [GitHub repo](https://github.com/21st-dev/21st.dev) and clone it to your local machine. We recommend using [Cursor](https://cursor.com) if you’re non-technical.

2. **Install Dependencies**: We’re big fans of `pnpm`! Run:
   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**: Create a `.env.local` file in the `apps/web` directory.

4. **Supabase Setup**:
   - Create a [Supabase](https://supabase.com) project.
   - Copy the **Project URL** and **Project API Keys** from the Supabase dashboard and add them to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://*****
     NEXT_PUBLIC_SUPABASE_KEY=*****
     SUPABASE_SERVICE_ROLE_KEY=*****
     ```
   - Install the [Supabase CLI](https://supabase.com/docs/guides/local-development) and apply DB migrations:
     ```bash
     supabase init
     cp db/migrations/*.sql supabase/migrations
     supabase link
     supabase start
     supabase db push
     ```

5. **Clerk Setup**:
   - Create a [Clerk](https://clerk.com) project.
   - Add these variables to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=*****
     CLERK_SECRET_KEY=*****
     ```
   - Add the [Supabase JWT integration](https://clerk.com/docs/integrations/databases/supabase) in the Clerk dashboard.
   - Launch **ngrok** and add its URL (`https://${your_ngrok_url}/api/webhooks/clerk`) to the Clerk dashboard.
   - Copy the webhook secret from Clerk to `.env.local`:
     ```
     CLERK_WEBHOOK_SECRET=*****
     ```

6. **Cloudflare R2 Setup**:
   - Create a Cloudflare R2 bucket called `components-code`.
   - Update `.env.local` with:
     ```
     NEXT_PUBLIC_CDN_URL=https://*****
     R2_ACCESS_KEY_ID=*****
     R2_SECRET_ACCESS_KEY=*****
     NEXT_PUBLIC_R2_ENDPOINT=https://*****
     ```

7. **Run the Development Server**:
   ```bash
   pnpm dev
   ```
   This starts the development server for all apps and packages in the monorepo. For more info on working with Turborepo, check out the [Turborepo documentation](https://turbo.build/repo/docs).

8. **Open a PR**: Once you’re done, open a PR to the `main` branch. We can’t wait to see what you’ve built! 🎉

---

## 🌍 Other Ways to Contribute

Not a coder? No problem! You can still contribute by:
- **Opening a GitHub Issue**: Report bugs or suggest new features.
- **Sharing Feedback**: DM us on [X (Twitter)](https://twitter.com) with your ideas or feedback.

---

## 👋 Meet the Team

Say hello to the brains behind 21st.dev:
- **AI Design Engineer**: [@serafimcloud](https://x.com/serafimcloud)
- **Fullstack Engineer**: [@daniel_dhawan](https://x.com/daniel_dhawan)
- **Fullstack Engineer**: [@garrrikkotua](https://x.com/garrrikkotua)

---

## 🙏 Acknowledgments

This project wouldn’t be possible without the incredible work of:
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindui.com/)
- [Sandpack by CodeSandbox](https://sandpack.codesandbox.io/)
- [Supabase](https://supabase.com)
- [Vercel](https://vercel.com)
- [Clerk Auth](https://clerk.com)
- [Cloudflare](https://cloudflare.com)
- [Cursor](https://cursor.com)
- [Claude 3.5 Sonnet by Anthropic](https://anthropic.com/)
- [MagicUI](https://magicui.design)

And, of course, **YOU**—our amazing open-source contributors! ❤️

---

## 🚀 Let’s Build the Future Together!

Ready to dive in? Start exploring, publishing, and contributing today. Let’s make 21st.dev the best place for React UI components on the web. Happy coding! 🎉  
