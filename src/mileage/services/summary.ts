import type { RequestHandler } from "express";
import { userModel } from "@/modules/stores/mongo";
import { mileageModel } from "../modules/mongo";
import { updateOldPendingTransaction } from "./transaction";
import globalStateDocs from "@/lottery/routes/docs/globalState";

export const summaryHandler: RequestHandler = async (req, res) => {
  const user = await userModel.findOne({
    _id: req.userOid,
    withdraw: false,
  });
  /** User가 존재하지 않으면 오류를 리턴 */
  if (!user) {
    return res.status(400).json({
      error: "Mileage/summary: User not found",
    });
  }

  await updateOldPendingTransaction(user._id);

  const transactions = await mileageModel
    .find({
      user: user._id,
      status: "confirmed",
    })
    .select({ amount: 1, expireAt: 1 })
    .lean();

  const now = req.timestamp ? new Date(req.timestamp) : new Date();

  const { expired, active } = transactions.reduce(
    (acc, transaction) => {
      if (transaction.expireAt <= now) {
        acc.expired += transaction.amount;
      } else {
        acc.active += transaction.amount;
      }
      return acc;
    },
    { expired: 0, active: 0 }
  );

  const totalMileage = expired + active;
  const activeMileage = active;

  const tier = getTier(activeMileage);

  return res.json({
    totalMileage,
    activeMileage,
    tier,
  });
};

const getTier = (activeMileage: number) => {
  if (activeMileage > 96000) return "gold";
  else if (activeMileage > 24000) return "silver";
  else if (activeMileage > 8000) return "normal";
  else return "none";
};
