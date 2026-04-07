# 🔐 SecureAuth — Next.js 15 + Supabase + NextAuth v5

A production-grade, secure authentication microservice built with:

- **Next.js 15** (App Router + Turbopack)
- **NextAuth v5** (JWT strategy)
- **Supabase** (Auth + Database)
- **Tailwind CSS + Shadcn UI**
- **Zod** (client + server validation)
- **TypeScript** (strict mode)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts   # NextAuth handler
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx                # /auth/login
│   │   └── reset-password/page.tsx       # /auth/reset-password
│   ├── dashboard/
│   │   ├── layout.tsx                    # Protected layout (requireAuth)
│   │   └── page.tsx                      # /dashboard
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                          # Root → redirect
├── components/
│   ├── auth/
│   │   ├── login-form.tsx                # Client form with Zod
│   │   ├── logout-button.tsx             # Client logout
│   │   └── reset-password-form.tsx       # Client form with Zod
│   └── ui/                              # Shadcn components
├── lib/
│   ├── auth/
│   │   ├── index.ts                      # NextAuth config (server-only)
│   │   └── helpers.ts                    # requireAuth, requireRole
│   ├── actions/
│   │   ├── auth.ts                       # loginAction, logoutAction
│   │   └── password.ts                   # reset + update password
│   ├── supabase/
│   │   └── server.ts                     # createAdminClient (server-only)
│   ├── types/
│   │   ├── index.ts                      # Shared types
│   │   └── next-auth.d.ts               # Session augmentation
│   └── utils/
│       ├── index.ts                      # cn(), helpers
│       └── validation.ts                 # Zod schemas
├── middleware.ts                         # Route protection
supabase/
└── setup.sql                            # DB setup script
```

---

## 🚀 Quick Start

### 1. Clone and install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase database

1. Go to **Supabase Dashboard → SQL Editor**
2. Run the contents of `supabase/setup.sql`
3. To make your existing user an admin, run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your@email.com';
```

### 4. Get your Supabase keys

- Go to: **Project Settings → API**
- Copy `Project URL` → `SUPABASE_URL`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**never expose this!**)
- Copy `anon` key → `SUPABASE_ANON_KEY`

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔑 Auth Flow

```
User visits /dashboard
    → Middleware checks JWT session
    → No session? Redirect → /auth/login
    → loginAction() validates with Zod
    → Supabase verifies email + password
    → NextAuth issues JWT
    → JWT stored in httpOnly cookie
    → User lands on /dashboard
```

### Password Reset Flow

```
/auth/reset-password
    → User enters email
    → requestPasswordResetAction() called
    → Supabase sends magic link email
    → User clicks link → /auth/reset-password/update?code=xxx
    → Token exchanged → password updated
```

---

## 🛡️ Security Architecture

| Layer | Mechanism |
|---|---|
| Secrets | Never prefixed with `NEXT_PUBLIC_` |
| Server isolation | `import "server-only"` on all sensitive modules |
| Session | JWT in `httpOnly`, `sameSite: lax` cookie |
| Password hashing | Delegated to Supabase Auth (bcrypt internally) |
| Input validation | Zod on both client and server |
| Route protection | `middleware.ts` + `requireAuth()` in layouts |
| API protection | Server Actions validate session before execution |
| Role-based access | `requireRole()` helper + session `role` field |
| Email enumeration | Reset endpoint always returns success message |
| Caching | `force-dynamic` on all auth/dashboard pages |

---

## 🔒 Role-Based Access

Roles: `user` | `admin`

To protect a route for admins only:

```typescript
// In any Server Component or layout:
import { requireRole } from "@/lib/auth/helpers";

const user = await requireRole("admin");
// Redirects to /dashboard if role is insufficient
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `next-auth@5` | Session + JWT management |
| `@supabase/supabase-js` | Database + Auth provider |
| `zod` | Schema validation |
| `react-hook-form` | Client-side form state |
| `@hookform/resolvers` | Zod ↔ react-hook-form bridge |
| `server-only` | Prevent server code leaking to client |
| `lucide-react` | Icons |
| `tailwindcss` + `shadcn/ui` | Styling |

---

## ⚠️ Important Notes

- **Never** commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — use only in server code
- NextAuth v5 is still in beta — check [next-auth.js.org](https://next-auth.js.org) for breaking changes
- Session tokens expire after **8 hours** (configurable in `src/lib/auth/index.ts`)

---

## 🏗️ Extending the System

### Add a new protected route

1. Add path to `PROTECTED_ROUTES` in `src/middleware.ts`
2. Call `requireAuth()` in the route's layout or page

### Add a new role

1. Update `UserRole` type in `src/lib/types/index.ts`
2. Update role hierarchy in `requireRole()` in `src/lib/auth/helpers.ts`
3. Update the `check` constraint in `supabase/setup.sql`

---

*This is an educational reference implementation. Always perform a security audit before deploying to production.*
