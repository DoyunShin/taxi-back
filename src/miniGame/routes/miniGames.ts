import express from "express";

import { miniGamesZod } from "./docs/schemas/miniGamesSchema";
import { authMiddleware, validateBody } from "@/middlewares";
import * as miniGameHandlers from "../services/miniGames";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/reinforcement/",
  validateBody(miniGamesZod.reinforcementHandler),
  miniGameHandlers.reinforcementHandler
);

router.get("/", miniGameHandlers.getMiniGameInfosHandler);

router.post(
  "/update",
  validateBody(miniGamesZod.updateCreditHandler),
  miniGameHandlers.updateCreditHandler
);

export default router;
