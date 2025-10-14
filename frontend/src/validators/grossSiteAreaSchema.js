// src/validators/grossSiteAreaSchema.js
import { z } from "zod";

export const grossSiteAreaSchema = z.object({
  acres: z.number().nonnegative().optional(),
  squareFeet: z.number().nonnegative().optional(),
  documents: z.array(z.string()).optional(),
});

export const validateGrossSiteArea = (data) => grossSiteAreaSchema.parse(data);
