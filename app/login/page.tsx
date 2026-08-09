import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-calm-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="hidden bg-[radial-gradient(circle_at_20%_20%,#bfdbfe_0,#eef7ff_28%,#f8fafc_68%)] px-12 py-16 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-sm font-black text-white">
              LT
            </span>
            <span className="text-lg font-black text-calm-900">LeadTask</span>
          </div>
          <div className="max-w-2xl">
            <h2 className="text-5xl font-black leading-tight text-calm-900">
              Calm, controlled lead operations for every employee.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-calm-600">
              Admins control staff, poster updates, lead progress, completion income, and rejection reasons.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-lg border border-calm-200 bg-white p-6 shadow-soft">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
