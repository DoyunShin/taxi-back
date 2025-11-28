import express from "express";
import { authMiddleware, validateQuery } from "@/middlewares";
import { statisticsZod } from "./docs/schemas/statisticsSchema";
import * as statisticsHandlers from "@/services/statistics";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/savings",
  validateQuery(statisticsZod.getsavingsHandler),
  statisticsHandlers.getsavingsHandler
);

router.get(
  "/room-creation/hourly-average",
  validateQuery(statisticsZod.gethourlyRoomCreationHandler),
  statisticsHandlers.gethourlyRoomCreationHandler
);

export default router;
