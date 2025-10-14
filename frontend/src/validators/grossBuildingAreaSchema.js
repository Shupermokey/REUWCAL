// src/validators/grossBuildingAreaSchema.js
import { z } from "zod";

export const grossBuildingAreaSchema = z.object({
  gba: z.number().nonnegative().optional(),
  gla: z.number().nonnegative().optional(),
  nra: z.number().nonnegative().optional(),
  documents: z.array(z.string()).optional(),
});

export const validateGrossBuildingArea = (data) => grossBuildingAreaSchema.parse(data);
