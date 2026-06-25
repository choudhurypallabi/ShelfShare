# ShelfShare

A community book lending app: list books you own, browse what others are lending, request to borrow, and track due dates. Backed by Supabase (Postgres + Auth + Realtime), hosted on Vercel.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (pick any region/name, free tier is fine).
2. Once it's ready, open **SQL Editor** in the left sidebar, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables, security policies, and turns on Realtime.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
4. In **Authentication → Providers**, make sure **Email** is enabled (it is by default). For local testing you may also want to turn off "Confirm email" under **Authentication → Settings** so signups work immediately without checking an inbox.

## 2. Configure the app locally

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste in your Project URL and anon key from step 1.3.

```bash
npm install
npm run dev
```

Open the app, click **Sign Up**, create an account, then use **Add Book** to list your first book. To load more demo data, see [`supabase/seed.sql`](supabase/seed.sql) (it needs a real user id, since every book has a real owner now).

## 3. How borrowing works

- A book starts **Available**. Anyone (other than the owner) can **Request to Borrow**, which sets it to **Pending**.
- The owner **Confirms**, which starts a **15-day loan**: the book becomes **Borrowed** and a due date is recorded.
- While borrowing, as long as no one else is on the waitlist, the borrower can **extend by 15 days**, up to **3 times** (45 extra days max), each extension carrying a small fee (recorded in the `extensions` table — no payment gateway is wired up yet, see below).
- The owner marks the book **Returned** at any time, which makes it **Available** again.
- If a book is already borrowed, other interested users can **join the waitlist**; a book with anyone on its waitlist can no longer be extended, so it actually comes back.

All of this updates **live** across every open browser tab via Supabase Realtime — no manual refresh needed.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo (`git init`, `git add -A`, `git commit`, then create a repo on GitHub and `git push`).
2. Go to [vercel.com](https://vercel.com), sign up/log in, **Add New Project**, and import that GitHub repo.
3. Vercel auto-detects Vite. Before deploying, add the same two environment variables from your `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under **Settings → Environment Variables**.
4. Deploy. You'll get a free `your-project.vercel.app` URL immediately; every push to `main` redeploys automatically.

## Not yet wired up (known follow-ups)

- **Real payment collection** for extension fees — currently just recorded as a fee amount + unpaid flag per extension. Adding Stripe Checkout for this is a clean next step.
- **Automated overdue reminders** — would need a scheduled Supabase Edge Function (or pg_cron job) to email/notify borrowers whose `due_at` has passed.
