import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date format",
  });

export const statisticsZod = {
  savingsHandler: z.object({
    startDate: dateString,
    endDate: dateString,
    userId: z.string().regex(patterns.objectId).optional(),
  }),
};

export const statisticsSchema = zodToSchemaObject(statisticsZod);

export type SavingsQuery = z.infer<typeof statisticsZod.savingsHandler>;
