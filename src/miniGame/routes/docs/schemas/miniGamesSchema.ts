import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const miniGamesZod = {
  updateCreditHandler: z.object({
    creditAmount: z.number().min(0),
  }),
  reinforcementHandler: z.object({
    part: z.enum(["PowerUnit", "Frame", "Tyre"]),
  }),
};

export const miniGamesSchema = zodToSchemaObject(miniGamesZod);

export type ReinforcementParams = z.infer<
  typeof miniGamesZod.reinforcementHandler
>;
export type UpdateCreditBody = z.infer<typeof miniGamesZod.updateCreditHandler>;
