import { SignupForm } from "@/components/SignupForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const customerSupportUrl = await prisma.quickLink
    .findUnique({
      where: { type: "CUSTOMER_SUPPORT" },
      select: { url: true }
    })
    .then((link) => link?.url ?? null)
    .catch(() => null);

  return (
    <main className="min-h-screen bg-calm-50">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="hidden bg-calm-900 px-12 py-16 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-sm font-black text-white shadow-sm">
              LT
            </span>
            <span className="text-lg font-black text-white">LeadTask</span>
          </div>
          <div className="max-w-2xl border-l-2 border-brand-500 pl-6">
            <p className="text-sm font-bold uppercase text-brand-100">Staff workspace</p>
            <h2 className="mt-4 text-5xl font-black leading-tight text-white">LeadTask</h2>
            <p className="mt-5 text-base font-medium text-slate-300">Employee lead management</p>
          </div>
        </section>
        <section className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-lg rounded-lg border border-calm-200 bg-white p-5 shadow-soft sm:p-7">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-sm font-black text-white shadow-sm">
                LT
              </span>
              <span className="text-lg font-black text-calm-900">LeadTask</span>
            </div>
            <SignupForm customerSupportUrl={customerSupportUrl} />
          </div>
        </section>
      </div>
    </main>
  );
}
