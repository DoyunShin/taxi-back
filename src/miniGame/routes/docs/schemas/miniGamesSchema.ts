import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";
import { reinforcementHandler } from "@/miniGame/services/miniGames";

export const miniGamesZod = {
  updateCreditHandler: z.object({
    score: z.number().min(0),
  }),
  reinforcementHandler: z.object({
    fail: z.boolean().optional(),
    burst: z.boolean().optional(),
  }),
  buyItemHandler: z.object({
    itemType: z.enum([
      "preventFail",
      "preventBurst",
      "makeLevel7",
      "makeLevel10",
      "makeLevel12",
    ]),
  }),
};

export const miniGamesSchema = zodToSchemaObject(miniGamesZod);

export type UpdateCreditBody = z.infer<typeof miniGamesZod.updateCreditHandler>;
