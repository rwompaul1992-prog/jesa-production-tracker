# JESA Production Tracker v1

A beginner-friendly production tracking web app for a dairy plant focused on one department in version 1: **INTAKE AND PASTEURIZATION**.

The app is built with:

- Next.js
- React
- TypeScript
- Material UI
- Recharts
- Supabase-ready authentication and database setup

## What this app does

This version helps a dairy plant team track:

- daily milk offloading
- daily milk pasteurization
- milk loss and loss percentage
- GEA CIP chemical usage
- operator performance
- monthly insights

It includes:

- a login screen with **Admin / Supervisor** and **Operator** roles
- a main dashboard page called **INTAKE AND PASTEURIZATION**
- editable production and CIP tables
- KPI summary cards
- charts
- operator ranking
- insights
- demo data for all four operators

## Demo login accounts

Use this password for all demo users:

```text
demo1234
```

Accounts:

- `admin@jesa.local` → Admin / Supervisor
- `mpima@jesa.local` → Operator
- `saadi@jesa.local` → Operator
- `robert@jesa.local` → Operator
- `manano@jesa.local` → Operator

> Important: the selected role on the login form must match the account you use.

## Project structure

Main files you will care about first:

- `app/page.tsx` → login page and app entry point
- `app/components/dashboard.tsx` → main Intake and Pasteurization dashboard UI
- `app/data/demo-data.ts` → sample production and CIP data
- `app/lib/analytics.ts` → calculations for totals, loss, rankings, and insights
- `app/lib/supabase.ts` → Supabase client setup
- `supabase/schema.sql` → database schema and access policies
- `.env.example` → environment variable template

## Before you start

Make sure you have these installed:

- **Node.js 18 or newer**
- **npm**
- **Git**

To check, run:

```bash
node -v
npm -v
git --version
```

## Quick start for beginners

### 1. Open the project folder

If you already have the repository on your computer:

```bash
cd jesa-production-tracker
```

If the folder is somewhere else, use that full path instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Create your local environment file

Copy the example file:

```bash
cp .env.example .env.local
```

You can leave the values empty if you only want to run the app in **demo mode**.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the app in your browser

Go to:

```text
http://localhost:3000
```

### 6. Log in

Use one of the demo accounts above.

For the simplest first test:

- Email: `admin@jesa.local`
- Password: `demo1234`
- Role: `Admin / Supervisor`

## Available scripts

Run these from the project root:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

What they do:

- `npm run dev` → starts local development server
- `npm run build` → creates a production build
- `npm run start` → runs the built production app
- `npm run lint` → runs lint checks
- `npm run typecheck` → runs TypeScript checks

## How demo mode works

If these environment variables are **not** set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

then the app runs in **demo mode**.

That means:

- login works with the hardcoded demo users
- the dashboard loads demo data from local files
- edits are only in the browser session and are not saved to a real database

## Exact Supabase setup steps

If you want real authentication and a real database, follow these steps exactly.

### Step 1: Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to finish provisioning

### Step 2: Get your Supabase project values

Inside your Supabase project:

1. Open **Project Settings**
2. Open **API**
3. Copy:
   - **Project URL**
   - **anon public key**

### Step 3: Add your local environment variables

Open `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Create the database tables

1. In Supabase, open the **SQL Editor**
2. Copy the full contents of `supabase/schema.sql`
3. Run that SQL

This creates:

- `profiles`
- `departments`
- `production_records`
- `cip_records`
- row level security policies

### Step 5: Create users in Supabase Auth

1. In Supabase, open **Authentication**
2. Create users for your supervisor and operators
3. Use the email addresses you want for real users

### Step 6: Add profile rows for each user

After creating auth users, insert matching rows into `public.profiles`.

Example SQL:

```sql
insert into public.profiles (id, full_name, role, department_key)
values
  ('SUPABASE_AUTH_USER_UUID_1', 'JESA Supervisor', 'admin', 'intake_and_pasteurization'),
  ('SUPABASE_AUTH_USER_UUID_2', 'Mpima Abubakar', 'operator', 'intake_and_pasteurization'),
  ('SUPABASE_AUTH_USER_UUID_3', 'Saadi Wakabi', 'operator', 'intake_and_pasteurization'),
  ('SUPABASE_AUTH_USER_UUID_4', 'Robert Bakwatanisa', 'operator', 'intake_and_pasteurization'),
  ('SUPABASE_AUTH_USER_UUID_5', 'Manano Vicent', 'operator', 'intake_and_pasteurization');
```

Replace the UUID values with the real user IDs from Supabase Auth.

### Step 7: Restart your local app

After saving `.env.local`, restart the app:

```bash
npm run dev
```

### Step 8: Test login

Once Supabase is configured, the app will attempt Supabase password login first.

## Exact local preview steps from scratch

If you are a beginner and want the full sequence from zero, use this exact order:

```bash
git clone <your-repo-url>
cd jesa-production-tracker
cp .env.example .env.local
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Exact deployment steps with Vercel

### Option 1: Deploy from GitHub to Vercel

1. Push this repository to GitHub.
2. Go to [https://vercel.com](https://vercel.com)
3. Sign in to Vercel.
4. Click **Add New** → **Project**.
5. Import your GitHub repository.
6. Keep the detected framework as **Next.js**.
7. In the environment variable section, add:

```text
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

8. Click **Deploy**.
9. Wait for deployment to finish.
10. Open the generated Vercel URL.

### Option 2: Deploy without Supabase first

If you only want to show the UI in demo mode:

1. Import the repository into Vercel.
2. Do **not** set Supabase variables yet.
3. Deploy.

The app will still load in demo mode.

## Production checklist

Before real production use, make sure you do these:

- configure real Supabase users
- insert matching rows into `public.profiles`
- verify row level security policies
- connect the tables to live read/write operations
- confirm operator permissions are correct
- test with real production records
- add backups and monitoring

## Known version 1 limitations

This version is intentionally simple.

Current limitations:

- data is still demo/local in the UI
- table edits are not yet persisted to Supabase
- only one department is included
- the app is Supabase-ready, not fully Supabase-complete yet

## Recommended next steps after v1

- save production and CIP records to Supabase
- load data from Supabase instead of demo data
- add audit logs for admin edits
- add CSV or Excel export
- add more departments
- add monthly and yearly filters
