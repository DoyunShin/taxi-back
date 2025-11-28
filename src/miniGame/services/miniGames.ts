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
    res.status(500).json({ error: "GlobalState/ : internal server error" });
  }
};
