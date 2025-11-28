import { authMiddleware } from "@/middlewares";
import * as miniGameHandlers from "../services/miniGames";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.get("/", miniGameHandlers.getMiniGameInfosHandler);

export default router;
