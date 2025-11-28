import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const miniGamesZod = {
  reinforcementHandler: z.object({
    part: z.enum(["PowerUnit", "Frame", "Tyre"]),
  }),
};

export const miniGamesSchema = zodToSchemaObject(miniGamesZod);

export type ReinforcementParams = z.infer<
  typeof miniGamesZod.reinforcementHandler
>;
