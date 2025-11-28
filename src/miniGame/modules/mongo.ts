import { model, Schema, Types } from "mongoose";
import { InferSchemaType } from "@/modules/stores/mongo";

const miniGameSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  level: { type: Number, required: true, default: 0 },
  creditAmount: { type: Number, required: true, default: 0 },
  preventFail: { type: Number, required: true, default: 0 },
  preventBurst: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, required: true },
});

export const miniGameModel = model("MiniGame", miniGameSchema);
export type MiniGame = InferSchemaType<typeof miniGameSchema>;
