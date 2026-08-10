import { z } from "zod";

const requiredText = (label: string, min = 2) =>
  z.string().trim().min(min, `${label} is required`).max(120, `${label} is too long`);

const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

export const loginSchema = z.object({
  employeeId: requiredText("Employee ID", 3).max(32),
  name: requiredText("Name", 2),
  password: z.string().min(1, "Password is required").max(128, "Password is too long")
});

export const selfSignupSchema = z.object({
  employeeId: requiredText("Employee ID", 3).max(32),
  name: requiredText("Name", 2),
  mobile: z.string().trim().regex(/^[0-9+\-\s]{7,18}$/, "Enter a valid mobile number"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")).default(""),
  state: z.string().trim().max(120, "State is too long").optional().default(""),
  password: strongPassword
});

export const customerCreateSchema = z.object({
  customerName: requiredText("Customer name", 2),
  mobile: z.string().trim().regex(/^[0-9+\-\s]{7,18}$/, "Enter a valid mobile number"),
  product: requiredText("Product", 2),
  date: z.string().trim().min(1, "Date is required")
});

export const filterSchema = z.object({
  name: z.string().trim().optional().default(""),
  product: z.string().trim().optional().default(""),
  date: z.string().trim().optional().default(""),
  employeeId: z.string().trim().optional().default("")
});

export const bankSchema = z.object({
  holderName: requiredText("Account holder", 2),
  accountNumber: z.string().trim().regex(/^[0-9]{6,24}$/, "Enter a valid account number"),
  ifsc: z.string().trim().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Enter a valid IFSC"),
  bankName: requiredText("Bank name", 2)
});

export const adminUserCreateSchema = z.object({
  employeeId: requiredText("Employee ID", 3).max(32),
  name: requiredText("Name", 2),
  password: strongPassword,
  mobile: z.string().trim().optional().default(""),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")).default(""),
  state: z.string().trim().optional().default(""),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE")
});

export const adminUserUpdateSchema = z.object({
  employeeId: requiredText("Employee ID", 3).max(32).optional(),
  name: requiredText("Name", 2).optional(),
  mobile: z.string().trim().optional().default(""),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")).default(""),
  state: z.string().trim().optional().default(""),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional()
});

export const adminPasswordSchema = z.object({
  password: strongPassword
});

export const leadUpdateSchema = z.object({
  status: z.enum(["NEW_LEAD", "IN_PROGRESS", "COMPLETED", "REJECTED"]),
  progress: z.coerce.number().int().min(0).max(100),
  income: z.coerce.number().min(0).max(999999999),
  rejectionReason: z.string().trim().max(500).optional().default("")
});

export const withdrawalUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"])
});

export const bonusRuleSchema = z.object({
  product: requiredText("Product", 2),
  bonusAmount: z.coerce.number().finite().min(0).max(999999999),
  thresholdCount: z.coerce.number().int().min(1).max(1000).default(10),
  windowDays: z.coerce.number().int().min(1).max(31).default(2),
  active: z.boolean().default(true)
});
