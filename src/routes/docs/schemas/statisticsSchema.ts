import { z } from "zod";
import patterns from "@/modules/patterns";
import { zodToSchemaObject } from "../utils";

const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid date format",
  });
const dayOfWeek = z.coerce.number().int().min(0).max(6);

export const statisticsZod = {
  savingsHandler: z.object({
    startDate: dateString,
    endDate: dateString,
    userId: z.string().regex(patterns.objectId).optional(),
  }),
  hourlyRoomCreationHandler: z.object({
    locationId: z.string().regex(patterns.objectId),
    dayOfWeek,
  }),
};

export const statisticsSchema = zodToSchemaObject(statisticsZod);

export type SavingsQuery = z.infer<typeof statisticsZod.savingsHandler>;
export type HourlyRoomCreationQuery = z.infer<
  typeof statisticsZod.hourlyRoomCreationHandler
>;
