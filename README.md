# 21st.dev

[21st.dev](https://21st.dev) is an open source community registry of React UI components where anyone can publish minimal Tailwind & Radix UI components and install any component via `npx shadcn`.

Inspired by [shadcn/ui](https://ui.shadcn.com/).

Built by RorkAI team and Claude 3.5 Sonnet.

## Publish your component

It takes 1 min to publish via our [publish page](https://21st.dev). To publish, you just need two files: `component.tsx` and `component.demo.tsx`.

We support:

- Pure React components
- Next.js client components (currently, we polyfill Next-specific libraries in CodeSandbox, but will switch to server-side rendering)
- TypeScript
- Tailwind themes with custom configuration
- Custom global CSS styles
- RadixUI
- Any other npm dependencies (via [Sandpack](https://sandpack.codesandbox.io/))
- Internal dependencies (you use any component of our registry as a dependency)

We encourage everyone to post TypeScript components, JS support is currently untested.

## Install a component

Pick a component from [21st.dev](https://21st.dev), copy the `npx shadcn` command, and run in your project's root folder.

For instance, for `shadcn/ui/accordion` you'll run:

```bash
npx shadcn@latest add "https://21st.dev/r/shadcn/accordion"
```

The command will create all the necessary files for the component and its dependencies (excluding the `.demo.tsx` file), and extend your Tailwind theme.

You can also copy the code directly from the website, but note that you’ll need to copy and paste all the files for the component and its dependencies, so using the `npx shadcn` command is the recommended way.

## Contributing to 21st

### Prerequisites

- Supabase account
- Clerk account
- ngrok or other tunneling software
- Cloudflare R2 account

### Setup

1. Fork the GitHub repo, clone to your local editor (we recommend Cursor if you're non-technical)

2. Install dependencies (we love `pnpm`)

   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the `apps/web` directory

4. Create a [Supabase](https://supabase.com) project and open Project Settings -> Configuration -> API.

Copy "Project URL" and "Project API Keys variables to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://*****
NEXT_PUBLIC_SUPABASE_KEY=*****
SUPABASE_SERVICE_ROLE_KEY=*****
```

5. Install [Supabase CLI](https://supabase.com/docs/guides/local-development) and apply DB migrations:

```
supabase init
cp db/migrations/*.sql supabase/migrations
# link local db to your remote project
supabase link
supabase start
supabase db push
```

6. Create a [Clerk](https://clerk.com) project

Add these variables to `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=*****
CLERK_SECRET_KEY=***
```

In Clerk dashboard add the [Supabase JWT integration](https://clerk.com/docs/integrations/databases/supabase).

Launch ngrok and add it's URL `https://${your_ngrok_url}/api/webhooks/clerk` to Clerk dashboard.
Copy the webhook secret from Clerk to `.env.local`

```
CLERK_WEBHOOK_SECRET=*****
```

7. Create a Cloudflare R2 bucket called `components-code`, update the `.env.local` to:

```
# public R2 CDN url
NEXT_PUBLIC_CDN_URL=https://*****
R2_ACCESS_KEY_ID=*****
R2_SECRET_ACCESS_KEY=*****
# private R2 url used to upload to the bucket
NEXT_PUBLIC_R2_ENDPOINT=https://*****
```

8. Run the development server:

   ```bash
   pnpm dev
   ```

   This will start the development server for all apps and packages in the monorepo.

   This project uses Vercel turborepo. For more information on working with Turborepo, refer to the [Turborepo documentation](https://turbo.build/repo/docs).

9. Open a PR to `main` branch

## Other ways to contribute

You can also contribute by:

- Opening a GitHub issue to report bugs or suggest new features
- DM us on X (Twitter) with your feedback or ideas

**Our team on X**

- AI design engineer [@serafimcloud](https://x.com/serafimcloud)
- fullstack engineer [@daniel_dhawan](https://x.com/daniel_dhawan)
- fullstack engineer [@garrrikkotua](https://x.com/garrrikkotua)

## Acknowledgments

This project wouldn't be possible without

- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind](https://tailwindui.com/)
- [Sandpack by CodeSandbox](https://sandpack.codesandbox.io/)
- [Supabase](https://supabase.com)
- [Vercel](https://vercel.com)
- [Clerk Auth](https://clerk.com)
- [Cloudflare](https://cloudlfare.com)
- [Cursor](https://cursor.com)
- [Claude 3.5 Sonnet by Anthropic](https://anthropic.com/)
- [MagicUI](https://magicui.design)

And, of course, our open source contributors ❤️
