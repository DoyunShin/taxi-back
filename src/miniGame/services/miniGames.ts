import type { RequestHandler } from "express";
import { miniGameModel } from "../modules/mongo";
import { userModel } from "@/modules/stores/mongo";

import { getLoginInfo, isLogin } from "@/modules/auths/login";
import logger from "@/modules/logger";

type LevelUpProbInfoType = {
  success: number;
  maintain: number;
  fail: number;
};
const levelUpProb: LevelUpProbInfoType[] = [
  { success: 100, maintain: 0, fail: 0 },
  { success: 95, maintain: 5, fail: 0 },
  { success: 90, maintain: 10, fail: 0 },
  { success: 85, maintain: 15, fail: 0 },
  { success: 75, maintain: 20, fail: 5 },
  { success: 70, maintain: 25, fail: 5 },
  { success: 60, maintain: 30, fail: 10 },
  { success: 50, maintain: 40, fail: 10 },
  { success: 45, maintain: 35, fail: 20 },
  { success: 35, maintain: 45, fail: 20 },
  { success: 30, maintain: 40, fail: 30 },
  { success: 25, maintain: 45, fail: 30 },
  { success: 15, maintain: 40, fail: 40 },
  { success: 15, maintain: 45, fail: 40 },
  { success: 10, maintain: 40, fail: 50 },
  { success: 8, maintain: 42, fail: 50 },
  { success: 5, maintain: 40, fail: 55 },
  { success: 3, maintain: 42, fail: 55 },
  { success: 2, maintain: 38, fail: 60 },
];

export const reinforcementHandler: RequestHandler = async (req, res) => {
  const user = await userModel.findById(req.userOid);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const miniGameData = await miniGameModel.findOne({ userId: user._id });
  if (!miniGameData) {
    return res.status(404).json({ error: "MiniGame data not found" });
  }

  const part = req.params.part;
  if (
    !req.params.part ||
    (part !== "PowerUnit" && part !== "Frame" && part !== "Tyre")
  ) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Invalid part parameter",
    });
  }

  const currentLevel =
    part === "PowerUnit"
      ? miniGameData.powerUnitLevel
      : part === "Frame"
      ? miniGameData.frameLevel
      : miniGameData.tyreLevel;

  // total 20 levels
  if (currentLevel >= 20) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Maximum level reached",
    });
  }

  const reinforcementCost = currentLevel * 100;
  if (miniGameData.creditAmount < reinforcementCost) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Insufficient credits",
    });
  }

  const probInfo = levelUpProb[currentLevel - 1];
  const rand = Math.floor(Math.random() * 100) + 1;

  let newLevel = currentLevel;
  if (rand <= probInfo.success) {
    newLevel = currentLevel + 1;
  } else if (rand <= probInfo.success + probInfo.maintain) {
    newLevel = currentLevel;
  } else {
    newLevel = Math.max(1, currentLevel - 1);
  }

  if (part === "PowerUnit") {
    miniGameData.powerUnitLevel = newLevel;
  } else if (part === "Frame") {
    miniGameData.frameLevel = newLevel;
  } else if (part === "Tyre") {
    miniGameData.tyreLevel = newLevel;
  }
  miniGameData.creditAmount -= reinforcementCost;
  miniGameData.updatedAt = new Date();
  await miniGameData.save();

  return res.status(200).json({
    powerUnitLevel: miniGameData.powerUnitLevel,
    frameLevel: miniGameData.frameLevel,
    tyreLevel: miniGameData.tyreLevel,
    creditAmount: miniGameData.creditAmount,
  });
};

export const getMiniGameInfosHandler: RequestHandler = async (req, res) => {
  try {
    const userId = isLogin(req) ? getLoginInfo(req).oid : null;
    const miniGameStatus = await miniGameModel.findOne({ userId }).lean();
    if (!miniGameStatus) {
      const newMiniGameStatus = new miniGameModel({
        userId: req.userOid,
        powerUnitLevel: 1,
        frameLevel: 1,
        tyreLevel: 1,
        creditAmount: 0,
        updatedAt: new Date(),
      });
      await newMiniGameStatus.save();
      return res.json({
        newMiniGameStatus,
      });
    }
    return res.json({
      miniGameStatus,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/ : internal server error" });
  }
};

export const updateCreditHandler: RequestHandler = async (req, res) => {
  try {
    const { creditAmount } = req.body;
    if (typeof creditAmount !== "number" || creditAmount < 0) {
      return res.status(400).json({ error: "Invalid credit amount" });
    }

    const updatedMiniGame = await miniGameModel
      .findOneAndUpdate(
        { userId: req.userOid },
        { creditAmount, updatedAt: new Date() },
        { new: true }
      )
      .lean();

    if (!updatedMiniGame) {
      return res.status(404).json({ error: "MiniGame data not found" });
    }

    return res.json({ updatedMiniGame });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/update : internal server error" });
  }
};
