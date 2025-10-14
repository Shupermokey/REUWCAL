// src/validators/financingSchema.js
import { z } from "zod";

export const financingSchema = z.object({
  loanAmount: z.number().nonnegative().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  termYears: z.number().nonnegative().optional(),
  amortization: z.number().nonnegative().optional(),
});

export const validateFinancing = (data) => financingSchema.parse(data);
