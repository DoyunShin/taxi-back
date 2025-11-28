import express from "express";

import { reinforcementHandler } from "../services/miniGames";
import { validateParams } from "@/middlewares";
import { miniGamesZod } from "./docs/schemas/miniGames";

const router = express.Router();

router.get(
  "/reinforcement/:part",
  validateParams(miniGamesZod.reinforcementHandler),
  reinforcementHandler
);
export default router;
