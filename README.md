# LeadTask

Full-stack Next.js application with separate admin and employee panels for lead entry, lead progress, income, posters, bank details, and withdrawals.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod validation
- Lucide icons
- HTTP-only session cookies
- CSRF protection for mutations
- Local upload fallback for development and Vercel Blob-ready storage for production

## Main Routes

- `/login` - Admin and employee login
- `/home` - Employee home, latest poster, filters, add customer, work process table
- `/profile` - Profile photo, read-only personal details, bank details, income, withdrawals
- `/admin/dashboard` - Admin overview
- `/admin/users` - Create, edit, delete employees and change passwords
- `/admin/customers` - Search and view all customers
- `/admin/leads` - Update status, progress, income, and rejection reasons
- `/admin/posters` - Upload/change active poster
- `/admin/withdrawals` - Update withdrawal request status

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Set `.env`.

For local Docker PostgreSQL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/employee_lead?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/employee_lead?schema=public"
UPLOAD_DRIVER="local"
BLOB_READ_WRITE_TOKEN=""
```

For Supabase:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
UPLOAD_DRIVER="supabase"
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_STORAGE_BUCKET="employee-leads"
SECURITY_PEPPER="CHANGE_ME_TO_A_LONG_RANDOM_SECRET"
SESSION_HOURS="12"
LOGIN_MAX_FAILED_ATTEMPTS="5"
LOGIN_LOCKOUT_MINUTES="15"
LOGIN_WINDOW_MINUTES="15"
```

Use Supabase's pooler connection string for deployed/serverless runtime. Use a direct or session-pooler connection for `DIRECT_URL`. Keep the service role key only in server environment variables.

3. If using local PostgreSQL, start it:

```bash
docker compose up -d postgres
```

4. Create database tables:

```bash
npm run db:push
```

5. Seed starter accounts:

```bash
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

## Seeded Login

Admin:

- Employee ID: `ADMIN001`
- Name: `Admin`
- Password: `Admin@123456`

Employee:

- Employee ID: `EMP001`
- Name: `Rahul Sharma`
- Password: `Employee@123`

## Production Notes

- Use Supabase PostgreSQL for `DATABASE_URL`.
- For Supabase Storage, create a public bucket named `employee-leads` or update `SUPABASE_STORAGE_BUCKET`.
- On Vercel Blob, set `UPLOAD_DRIVER="vercel_blob"` and add `BLOB_READ_WRITE_TOKEN`.
- Never rely on Vercel function filesystem for persistent uploads.
- Rotate seeded passwords immediately after the first deployment.

## Security Included

- Password hashing with Node `scrypt`
- HTTP-only session cookie
- Server-side role checks
- CSRF token validation for POST, PUT, PATCH, and DELETE routes
- Prisma parameterized queries
- Zod request validation
- Safer image upload restrictions: PNG, JPG, and WebP only, max 5 MB
- Security headers in middleware
- Login brute-force protection with database-backed lockouts
- Strong admin-created password policy
- Configurable session expiry, default 12 hours
- Content Security Policy and production HSTS headers
