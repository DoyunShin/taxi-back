import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const miniGamesZod = {
  updateCreditHandler: z.object({
    creditAmount: z.number().min(0),
  }),
};

export const miniGamesSchema = zodToSchemaObject(miniGamesZod);

export type UpdateCreditBody = z.infer<typeof miniGamesZod.updateCreditHandler>;
