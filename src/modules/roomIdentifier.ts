import crypto from "crypto";
import { roomModel } from "@/modules/stores/mongo";

const timeWindow = 1000 * 60 * 30; // 30분
const emojis = [
  "🍎",
  "🍊",
  "🍋",
  "🍉",
  "🍇",
  "🍓",
  "🍒",
  "🍍",
  "🥝",
  "🥥",
  "🍑",
  "🍌",
  "🥕",
  "🌽",
  "🥦",
  "🍄",
];
const numericIdentifierDigits = 3;
const numericIdentifierRetries = 10;

const selectEmojiIdentifier = (usedEmojis: Set<string>) => {
  const availableEmojis = emojis.filter((emoji) => !usedEmojis.has(emoji));
  if (availableEmojis.length === 0) {
    return undefined;
  }
  return availableEmojis[crypto.randomInt(availableEmojis.length)];
};

const selectNumericIdentifier = (usedNumbers: Set<string>) => {
  for (let attempt = 0; attempt < numericIdentifierRetries; attempt++) {
    const number = crypto.randomInt(10 ** numericIdentifierDigits);
    const numberString = number
      .toString()
      .padStart(numericIdentifierDigits, "0");
    if (!usedNumbers.has(numberString)) {
      return numberString;
    }
  }
  return undefined;
};

export const allocateRoomIdentifiers = async (departureTime: Date) => {
  const nearbyRooms = await roomModel
    .find(
      {
        time: {
          $gte: departureTime.getTime() - timeWindow,
          $lte: departureTime.getTime() + timeWindow,
        },
      },
      "emojiIdentifier numericIdentifier"
    )
    .lean();

  const usedEmojis = new Set(
    nearbyRooms
      .map((room) => room.emojiIdentifier)
      .filter((identifier): identifier is string => Boolean(identifier))
  );
  const usedNumbers = new Set(
    nearbyRooms
      .map((room) => room.numericIdentifier)
      .filter((identifier): identifier is string => Boolean(identifier))
  );

  return {
    emojiIdentifier: selectEmojiIdentifier(usedEmojis),
    numericIdentifier: selectNumericIdentifier(usedNumbers),
  };
};
