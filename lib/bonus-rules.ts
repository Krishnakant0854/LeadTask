import "server-only";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export async function assertBonusProductIsAvailable(product: string, excludeId?: string) {
  const existing = await prisma.bonusRule.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      product: { equals: product, mode: "insensitive" }
    }
  });

  if (existing) {
    throw Object.assign(new Error("A bonus rule already exists for this product"), { status: 409 });
  }
}

export function serializeBonusRule(rule: {
  id: string;
  product: string;
  bonusAmount: unknown;
  thresholdCount: number;
  windowDays: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: rule.id,
    product: rule.product,
    bonusAmount: toNumber(rule.bonusAmount),
    thresholdCount: rule.thresholdCount,
    windowDays: rule.windowDays,
    active: rule.active,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  };
}
