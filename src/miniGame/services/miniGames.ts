import type { RequestHandler } from "express";
import { miniGameModel } from "../modules/mongo";
import { getLoginInfo, isLogin } from "@/modules/auths/login";
import logger from "@/modules/logger";

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
