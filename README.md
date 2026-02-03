This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Before running the project, you need to configure the required environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (for server-side operations) |
   | `RESEND_API_KEY` | Yes | Resend API key for email notifications ([get one here](https://resend.com/api-keys)) |
   | `EMAIL_FROM` | No | Email sender address (default: `Stoop Politics <noreply@stooppolitics.com>`) |
   | `NEXT_PUBLIC_SITE_URL` | No | Site URL for email links (default: `https://stooppolitics.com`) |

> ⚠️ **Important**: Email notifications will NOT work without a valid `RESEND_API_KEY`. Make sure to verify your sending domain in Resend dashboard.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
