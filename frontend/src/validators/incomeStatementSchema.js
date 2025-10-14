import { z } from "zod";

export const incomeStatementSchema = z.object({
  Income: z.record(z.any()).optional(),
  Expenses: z.record(z.any()).optional(),
  CashFlow: z.record(z.any()).optional(),
});
