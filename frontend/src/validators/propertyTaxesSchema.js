import { z } from "zod";

export const propertyTaxesSchema = z.object({
  pins: z.array(z.string()).optional(),
  totalAmount: z.number().nonnegative().optional(),
  breakdown: z.record(z.any()).optional(),
});

export const validatePropertyTaxes = (data) => propertyTaxesSchema.parse(data);
