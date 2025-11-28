import { model, Schema, Types } from "mongoose";
import { InferSchemaType } from "@/modules/stores/mongo";

const miniGameSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },
  level: { type: Number, required: true, default: 0 },
  creditAmount: { type: Number, required: true, default: 0 },
  preventFail: { type: Number, required: true, default: 0 },
  preventBurst: { type: Number, required: true, default: 0 },
  dodgeScore: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, required: true },
});

export const miniGameModel = model("MiniGame", miniGameSchema);
export type MiniGame = InferSchemaType<typeof miniGameSchema>;

const wordChainSchema = new Schema({
  roomId: { type: Types.ObjectId, ref: "Room", required: true },
  currentWord: { type: String, required: true },
  usedWords: { type: [String], required: true },
  players: { type: [Types.ObjectId], ref: "User", required: true },
  currentPlayerIndex: { type: Number, required: true },
  finished: { type: Boolean, required: true, default: false },
  updatedAt: { type: Date, required: true },
});

export const wordChainModel = model("WordChain", wordChainSchema);
export type WordChain = InferSchemaType<typeof wordChainSchema>;

const dictionarySchema = new Schema({
  word: { type: String, required: true },
});

export const dictionaryModel = model("Dictionary", dictionarySchema);
export type Dictionary = InferSchemaType<typeof dictionarySchema>;
