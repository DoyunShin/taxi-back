import { dictionaryModel } from "./mongo";
import fs from "fs/promises";
import logger from "@/modules/logger";

const BATCH_SIZE = 1000;

export const getDictionary = async () => {
  const fileContent = await fs.readFile("src/miniGame/dictionary.txt", "utf-8");
  const words = fileContent.split("\n").map((w) => w.trim());
  logger.info(`Loaded ${words.length} words into dictionary`);

  let batch: { word: string }[] = [];
  for (let i = 0; i < words.length; i++) {
    batch.push({ word: words[i] });

    if (batch.length >= BATCH_SIZE) {
      await dictionaryModel.insertMany(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await dictionaryModel.insertMany(batch);
  }

  const result = await dictionaryModel.find();
  logger.info(`Inserted ${result.length} words into dictionary collection`);
};
