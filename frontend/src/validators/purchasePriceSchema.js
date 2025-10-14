// src/validators/purchasePriceSchema.js
import { z } from "zod";

export const purchasePriceSchema = z.object({
  contractPrice: z.number().nonnegative().optional(),
  dueDiligence: z.number().nonnegative().optional(),
  capitalReserve: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
});

export const validatePurchasePrice = (data) => purchasePriceSchema.parse(data);
