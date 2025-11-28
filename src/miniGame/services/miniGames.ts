import type { RequestHandler } from "express";
import { miniGameModel } from "../modules/mongo";
import { userModel } from "@/modules/stores/mongo";

import { getLoginInfo, isLogin } from "@/modules/auths/login";
import logger from "@/modules/logger";

type LevelUpProbInfoType = {
  success: number;
  maintain: number;
  fail: number;
  burst: number;
};
const levelUpProb: LevelUpProbInfoType[] = [
  { success: 100, maintain: 0, fail: 0, burst: 0 },
  { success: 95, maintain: 5, fail: 0, burst: 0 },
  { success: 90, maintain: 10, fail: 0, burst: 0 },
  { success: 85, maintain: 15, fail: 0, burst: 0 },
  { success: 75, maintain: 20, fail: 5, burst: 0 },
  { success: 70, maintain: 25, fail: 5, burst: 0 },
  { success: 60, maintain: 30, fail: 10, burst: 0 },
  { success: 50, maintain: 40, fail: 10, burst: 0 },
  { success: 45, maintain: 35, fail: 20, burst: 0 },
  { success: 35, maintain: 45, fail: 20, burst: 0 },
  { success: 30, maintain: 40, fail: 30, burst: 0 },
  { success: 25, maintain: 45, fail: 30, burst: 0 },
  { success: 15, maintain: 40, fail: 40, burst: 0 },
  { success: 15, maintain: 45, fail: 40, burst: 0 },
  { success: 10, maintain: 35, fail: 45, burst: 10 },
  { success: 8, maintain: 32, fail: 40, burst: 20 },
  { success: 5, maintain: 25, fail: 40, burst: 30 },
  { success: 3, maintain: 22, fail: 35, burst: 40 },
  { success: 2, maintain: 13, fail: 35, burst: 50 },
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

  const currentLevel = miniGameData.level;

  // total 20 levels
  if (currentLevel >= 20) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Maximum level reached",
    });
  }

  const reinforcementCost = currentLevel * 100;
  if (miniGameData.creditAmount <= reinforcementCost) {
    return res.status(400).json({
      error: "miniGame/miniGames/reinforcement: Insufficient credits",
    });
  }

  const probInfo = levelUpProb[currentLevel - 1];
  const rand = Math.floor(Math.random() * 100) + 1;

  let newLevel = currentLevel;
  let levelUpMessage = "";
  if (rand <= probInfo.success) {
    newLevel = currentLevel + 1;
    levelUpMessage = "강화 성공!";
  } else if (rand <= probInfo.success + probInfo.maintain) {
    newLevel = currentLevel;
    levelUpMessage = "강화 유지.";
  } else if (rand <= probInfo.success + probInfo.maintain + probInfo.fail) {
    newLevel = Math.max(1, currentLevel - 1);
    levelUpMessage = "강화 실패.";
  } else {
    newLevel = 1;
    levelUpMessage = "-레제-";
  }

  miniGameData.level = newLevel;
  miniGameData.creditAmount -= reinforcementCost;
  miniGameData.updatedAt = new Date();
  await miniGameData.save();

  return res.status(200).json({
    levelUpMessage,
    level: newLevel,
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
        level: 1,
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

    const currentMiniGame = await miniGameModel.findOne({
      userId: req.userOid,
    });
    if (!currentMiniGame) {
      return res.status(404).json({ error: "MiniGame data not found" });
    }

    const updatedMiniGame = await miniGameModel
      .findOneAndUpdate(
        { userId: req.userOid },
        {
          creditAmount: currentMiniGame.creditAmount + creditAmount,
          updatedAt: new Date(),
        },
        { new: true }
      )
      .lean();

    return res.json({ updatedMiniGame });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "miniGames/update : internal server error" });
  }
};
