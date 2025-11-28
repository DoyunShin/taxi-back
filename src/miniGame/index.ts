import express from "express";

import miniGameRouter from "./routes/miniGames";

const router = express.Router();

router.use("/miniGames", miniGameRouter);

export default router;
