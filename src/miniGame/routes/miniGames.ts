import { authMiddleware, validateBody } from "@/middlewares";
import { miniGamesZod } from "./docs/schemas/miniGamesSchema";
import * as miniGameHandlers from "../services/miniGames";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.get("/", miniGameHandlers.getMiniGameInfosHandler);

router.post(
  "/update",
  validateBody(miniGamesZod.updateCreditHandler),
  miniGameHandlers.updateCreditHandler
);

export default router;
