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
- Tailwind themes
- RadixUI
- Any other npm dependencies (via [Sandpack](https://sandpack.codesandbox.io/)
- Internal dependencies (you use any component of our registry as a dependency)

We encourage everyone to post TypeScript components, JS support is currently untested.

## Install a component
Pick a component from [21st.dev](https://21st.dev), copy the `npx shadcn` command, and run in your project's root folder.

For instance, for `shadcn/ui/accordion` you'll run:
```bash
npx shadcn@latest add "https://21st.dev/api/r/shadcn/accordion"
```

You can also copy the code directly.

## Contributing to 21st

1. Fork the GitHub repo, clone to your local editor (we recommend Cursor if you're non-technical)

2. Install dependencies (we love `pnpm`)

   ```bash
   pnpm install
   ```

3. Run the development server:

    ```bash
    pnpm dev
    ```

    This will start the development server for all apps and packages in the monorepo.

    This project uses Vercel turborepo. For more information on working with Turborepo, refer to the [Turborepo documentation](https://turbo.build/repo/docs).

4. Open a PR to `main` branch

## Other ways to contribute

You can also contribute by:

- Opening a GitHub issue to report bugs or suggest new features
- DM us on X (Twitter) with your feedback or ideas

**Our team on X**
- AI design engineer [@serafimcloud](https://x.com/serafimcloud)
- fullstack engineer [@daniel_dhawan](https://x.com/daniel_dhawan)

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
- [MagicUI](https://magicui.com)