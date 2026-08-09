import { BonusRulesManager } from "@/components/admin/BonusRulesManager";
import { serializeBonusRule } from "@/lib/bonus-rules";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminBonusPage() {
  const rules = await prisma.bonusRule.findMany({ orderBy: { product: "asc" } });
  return <BonusRulesManager initialRules={rules.map(serializeBonusRule)} />;
}
