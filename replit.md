# FADA LOGISTICS — CRM System

## Overview
Air freight logistics CRM for **CÔNG TY TNHH FADA LOGISTICS** (Fada Express), built with Next.js 15, SQLite/Prisma, NextAuth, and Tailwind CSS. Full CRM features + public landing page + carrier tracking page.

**Company info:** Phone 0795.6666.72 | Email atus@fadalogisticsvn.com | MST 3703354696 | Bank STK 1059360605 Vietcombank CN Đông Sài Gòn

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma ORM (`prisma/dev.db`)
- **Auth**: NextAuth.js with JWT + bcryptjs
- **Styling**: Tailwind CSS with custom brand colors
- **Port**: 5000 (0.0.0.0 binding for Replit)
- **Package manager**: npm with `legacy-peer-deps=true`

## Running the App
```
npm run dev
```
Workflow: `Start application` → `npm run dev -p 5000 -H 0.0.0.0`

## Login Credentials (seeded)
| Email | Password | Role |
|-------|----------|------|
| admin@logictis.com | admin123 | ADMIN |
| sale@logictis.com | sale123 | SALE |
| sale2@logictis.com | sale456 | SALE |
| sale3@logictis.com | sale789 | SALE |
| accounting@logictis.com | acc123 | ACCOUNTING |

## Key Files
- `lib/auth.ts` — NextAuth credentials provider config
- `lib/mail.ts` — Email sender (nodemailer), requires EMAIL_* secrets
- `lib/prisma.ts` — Prisma client singleton
- `middleware.ts` — Auth middleware (excludes all /api/ routes)
- `app/api/auth/forgot-password/route.ts` — Password reset API
- `app/api/auth/reset-password/route.ts` — Password reset confirm API
- `app/api/counts/route.ts` — Lightweight sidebar counts endpoint
- `context/SystemContext.tsx` — System name/logo context
- `context/ToastContext.tsx` — Toast notification context (React Portal)
- `components/layout/ClientLayout.tsx` — Main layout wrapper

## Environment Secrets Required
| Secret | Purpose |
|--------|---------|
| `NEXTAUTH_SECRET` | JWT signing key (required, set) |
| `NEXTAUTH_URL` | Auth base URL (optional, auto-detected via REPLIT_DEV_DOMAIN) |
| `EMAIL_HOST` | SMTP host (optional, not set) |
| `EMAIL_PORT` | SMTP port (optional, not set) |
| `EMAIL_USER` | SMTP user (optional, not set) |
| `EMAIL_PASS` | SMTP password (optional, not set) |
| `EMAIL_FROM` | From address (optional, not set) |
| `EMAIL_SECURE` | SMTP TLS (optional, not set) |

## Email Not Configured
When EMAIL_USER/EMAIL_PASS are not set:
- Forgot-password API returns the reset link directly in `devResetUrl` field
- The forgot-password page displays the link and copy/open buttons
- Reset link is also logged to server console

## Known Fixes Applied
1. **Middleware** — Excludes all `/api/` routes so API calls work from public pages (login/forgot-password)
2. **auth.ts** — Removed debug `fs.appendFileSync` logging; clean credentials flow
3. **Toast** — Uses React Portal (`document.body`), positioned `top-20` below header
4. **Branding** — All "FADA LOGISTICS" references updated to "LOGICTIS AIR"
5. **NEXTAUTH_URL** — `getBaseUrl()` in forgot-password uses `REPLIT_DEV_DOMAIN` env variable

## Database Schema (key models)
- `User` — staff accounts with roles (ADMIN/SALE/ACCOUNTING); has `assignedLeads` relation
- `Customer` — client companies
- `Flight` — flight routes
- `Booking` — air freight bookings with VND pricing; has `otherFeeLabel` field for custom fee names
- `Invoice` — invoices tied to bookings
- `AppSetting` — global system settings (name, logo, company info)
- `PasswordResetToken` — secure password reset tokens (1hr expiry)
- `ContactLead` — landing page inquiries; has `assignedToId` for assigning to sales staff
- `ActivityLog` — audit trail for all booking changes

## Recent Features (session)
- **`otherFeeLabel`**: Custom fee label on bookings (create form + API updated)
- **Leads assignment**: ADMIN can assign leads to sales; SALE only sees their assigned + unassigned
- **Mobile filter**: Advanced filter drawer on bookings page (date range + customer filter + badge)
- **My Bill Excel**: FADA-branded export with orange header, logo, 13 columns, paid/remaining breakdown
- **Analytics**: 5-tab system (Monthly, P&L by Employee, P&L by Customer, Commission, Download)
- **17Track API**: Carrier tracking via SEVENTEEN_TRACK_API_KEY secret
- **PDF Invoice**: A4 layout with orange band, logo, itemized table, bank info, signatures
- **Settings Logs**: Full activity log viewer at /settings/logs with search/filter/pagination
- **Tracking fix**: Removed unsupported `mode: "insensitive"` (SQLite incompatible)
