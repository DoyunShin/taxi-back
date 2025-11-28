import express from "express";
import { authMiddleware, validateQuery } from "@/middlewares";
import { statisticsZod } from "./docs/schemas/statisticsSchema";
import * as statisticsHandlers from "@/services/statistics";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/savings",
  validateQuery(statisticsZod.savingsHandler),
  statisticsHandlers.savingsHandler
);

router.get(
  "/room-creation/hourly-average",
  validateQuery(statisticsZod.hourlyRoomCreationHandler),
  statisticsHandlers.hourlyRoomCreationHandler
);

export default router;
