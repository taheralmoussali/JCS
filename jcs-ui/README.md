# JCS Management System

Arabic RTL starter UI for Jeroud Charitable Society using Next.js, TypeScript, Tailwind CSS, shadcn-style components, and Supabase.

## 1. Requirements
- Node.js 20+
- npm
- A Supabase project containing the JCS schema

## 2. Install
```bash
npm install
```

## 3. Configure Supabase
Copy `.env.example` to `.env.local` and set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
```
Use the public/publishable Supabase client key appropriate for your project. Never put the service-role key in `.env.local` for browser code.

## 4. Run
```bash
npm run dev
```
Open http://localhost:3000

## 5. Current screens
- Dashboard `/`
- Families `/families`
- Family profile `/families/[id]`
- Aid `/aid`
- Visits `/visits`
- Reports `/reports`
- Settings `/settings`

## Important
The current UI is an MVP scaffold. Before production, add authentication, RLS policies, create/edit forms, audit logs, validation, error handling, loading states, document storage, and role permissions.
