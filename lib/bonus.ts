import "server-only";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

type BonusBreakdown = {
  product: string;
  completedCount: number;
  bonusCount: number;
  bonusAmount: number;
  totalBonus: number;
};

export type BonusSummary = {
  totalBonus: number;
  breakdown: BonusBreakdown[];
};

type BonusCustomer = {
  id: string;
  userId: string;
  product: string;
  date: Date;
};

export async function calculateBonusSummary(userId?: string): Promise<BonusSummary> {
  const [rules, customers] = await Promise.all([
    prisma.bonusRule.findMany({ where: { active: true }, orderBy: { product: "asc" } }),
    prisma.customer.findMany({
      where: {
        ...(userId ? { userId } : {}),
        leadProcess: { is: { status: "COMPLETED" } }
      },
      select: {
        id: true,
        userId: true,
        product: true,
        date: true
      },
      orderBy: [{ date: "asc" }, { id: "asc" }]
    })
  ]);

  const ruleByProduct = new Map(rules.map((rule) => [normalizeProduct(rule.product), rule]));
  const customerGroups = new Map<string, BonusCustomer[]>();

  for (const customer of customers) {
    const normalizedProduct = normalizeProduct(customer.product);
    if (!ruleByProduct.has(normalizedProduct)) continue;

    const key = `${customer.userId}:${normalizedProduct}`;
    const group = customerGroups.get(key) ?? [];
    group.push(customer);
    customerGroups.set(key, group);
  }

  const breakdown: BonusBreakdown[] = [];

  for (const [key, group] of customerGroups) {
    const normalizedProduct = key.slice(key.indexOf(":") + 1);
    const rule = ruleByProduct.get(normalizedProduct);
    if (!rule) continue;

    let windowStartIndex = 0;
    let bonusCount = 0;

    for (const [customerIndex, customer] of group.entries()) {
      const windowStart = getWindowStart(customer.date, rule.windowDays);

      while (group[windowStartIndex] && group[windowStartIndex].date < windowStart) {
        windowStartIndex += 1;
      }

      if (customerIndex - windowStartIndex + 1 > rule.thresholdCount) {
        bonusCount += 1;
      }
    }

    const bonusAmount = toNumber(rule.bonusAmount);
    breakdown.push({
      product: rule.product,
      completedCount: group.length,
      bonusCount,
      bonusAmount,
      totalBonus: bonusCount * bonusAmount
    });
  }

  return {
    totalBonus: breakdown.reduce((total, item) => total + item.totalBonus, 0),
    breakdown: breakdown.sort((left, right) => left.product.localeCompare(right.product))
  };
}

function normalizeProduct(product: string) {
  return product.trim().toLowerCase();
}

function getWindowStart(date: Date, windowDays: number) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - Math.max(windowDays - 1, 0));
  return start;
}
