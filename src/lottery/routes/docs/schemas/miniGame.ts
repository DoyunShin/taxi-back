import { z } from "zod";
import { zodToSchemaObject } from "@/routes/docs/utils";

export const miniGameZod = {};

export const miniGameSchema = zodToSchemaObject(miniGameZod);
