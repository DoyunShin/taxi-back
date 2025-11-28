import logger from "@/modules/logger";

const buildFareKey = (fromName: string, toName: string) =>
  [fromName, toName].sort().join("||");

// Example fare table for all known routes. Keys are unordered pairs of location names.
const ESTIMATED_FARE_TABLE: Record<string, number> = {
  // Taxi Stand
  [buildFareKey("Taxi Stand", "Daejeon Station")]: 10000,
  [buildFareKey("Taxi Stand", "Daejeon Terminal Complex")]: 17000,
  [buildFareKey("Taxi Stand", "Galleria Timeworld")]: 10000,
  [buildFareKey("Taxi Stand", "Gung-dong Rodeo Street")]: 7000,
  [buildFareKey("Taxi Stand", "Yuseong Express Bus Terminal")]: 9000,
  [buildFareKey("Taxi Stand", "Mannyon Middle School")]: 8000,
  [buildFareKey("Taxi Stand", "Seodaejeon Station")]: 16000,
  [buildFareKey("Taxi Stand", "Shinsegae Department Store")]: 9000,
  [buildFareKey("Taxi Stand", "Duck Pond")]: 5000,
  [buildFareKey("Taxi Stand", "Wolpyeong Station")]: 9000,
  [buildFareKey("Taxi Stand", "Yuseong-gu Office")]: 9000,
  [buildFareKey("Taxi Stand", "Yuseong Intercity Bus Terminal")]: 9000,
  [buildFareKey(
    "Taxi Stand",
    "Government Complex Express Bus Terminal"
  )]: 14000,
  [buildFareKey(
    "Taxi Stand",
    "Government Complex Intercity Bus Terminal"
  )]: 14000,

  // Daejeon Station
  [buildFareKey("Daejeon Station", "Gung-dong Rodeo Street")]: 12000,
  [buildFareKey("Daejeon Station", "Wolpyeong Station")]: 13000,
  [buildFareKey("Daejeon Station", "Yuseong-gu Office")]: 14000,
  [buildFareKey("Daejeon Station", "Galleria Timeworld")]: 9000,
  [buildFareKey("Daejeon Station", "Daejeon Terminal Complex")]: 6000,
  [buildFareKey("Daejeon Station", "Mannyon Middle School")]: 12000,
  [buildFareKey("Daejeon Station", "Seodaejeon Station")]: 9000,
  [buildFareKey("Daejeon Station", "Shinsegae Department Store")]: 11000,
  [buildFareKey("Daejeon Station", "Duck Pond")]: 13000,
  [buildFareKey("Daejeon Station", "Yuseong Express Bus Terminal")]: 15000,
  [buildFareKey("Daejeon Station", "Yuseong Intercity Bus Terminal")]: 15000,
  [buildFareKey(
    "Daejeon Station",
    "Government Complex Express Bus Terminal"
  )]: 8000,
  [buildFareKey(
    "Daejeon Station",
    "Government Complex Intercity Bus Terminal"
  )]: 8000,

  // Galleria Timeworld
  [buildFareKey("Galleria Timeworld", "Yuseong-gu Office")]: 8000,
  [buildFareKey("Galleria Timeworld", "Gung-dong Rodeo Street")]: 7000,
  [buildFareKey("Galleria Timeworld", "Daejeon Terminal Complex")]: 8000,
  [buildFareKey("Galleria Timeworld", "Mannyon Middle School")]: 7000,
  [buildFareKey("Galleria Timeworld", "Seodaejeon Station")]: 9000,
  [buildFareKey("Galleria Timeworld", "Shinsegae Department Store")]: 5000,
  [buildFareKey("Galleria Timeworld", "Duck Pond")]: 7000,
  [buildFareKey("Galleria Timeworld", "Wolpyeong Station")]: 6000,
  [buildFareKey("Galleria Timeworld", "Yuseong Express Bus Terminal")]: 9000,
  [buildFareKey("Galleria Timeworld", "Yuseong Intercity Bus Terminal")]: 9000,
  [buildFareKey(
    "Galleria Timeworld",
    "Government Complex Express Bus Terminal"
  )]: 8000,
  [buildFareKey(
    "Galleria Timeworld",
    "Government Complex Intercity Bus Terminal"
  )]: 8000,

  // Gung-dong Rodeo Street
  [buildFareKey("Gung-dong Rodeo Street", "Daejeon Terminal Complex")]: 15000,
  [buildFareKey("Gung-dong Rodeo Street", "Mannyon Middle School")]: 6000,
  [buildFareKey("Gung-dong Rodeo Street", "Seodaejeon Station")]: 14000,
  [buildFareKey("Gung-dong Rodeo Street", "Shinsegae Department Store")]: 8000,
  [buildFareKey("Gung-dong Rodeo Street", "Duck Pond")]: 5000,
  [buildFareKey("Gung-dong Rodeo Street", "Wolpyeong Station")]: 8000,
  [buildFareKey("Gung-dong Rodeo Street", "Yuseong-gu Office")]: 7000,
  [buildFareKey(
    "Gung-dong Rodeo Street",
    "Yuseong Express Bus Terminal"
  )]: 8000,
  [buildFareKey(
    "Gung-dong Rodeo Street",
    "Yuseong Intercity Bus Terminal"
  )]: 8000,
  [buildFareKey(
    "Gung-dong Rodeo Street",
    "Government Complex Express Bus Terminal"
  )]: 13000,
  [buildFareKey(
    "Gung-dong Rodeo Street",
    "Government Complex Intercity Bus Terminal"
  )]: 13000,

  // Daejeon Terminal Complex
  [buildFareKey("Daejeon Terminal Complex", "Mannyon Middle School")]: 14000,
  [buildFareKey("Daejeon Terminal Complex", "Seodaejeon Station")]: 9000,
  [buildFareKey(
    "Daejeon Terminal Complex",
    "Shinsegae Department Store"
  )]: 9000,
  [buildFareKey("Daejeon Terminal Complex", "Duck Pond")]: 15000,
  [buildFareKey("Daejeon Terminal Complex", "Wolpyeong Station")]: 12000,
  [buildFareKey("Daejeon Terminal Complex", "Yuseong-gu Office")]: 12000,
  [buildFareKey(
    "Daejeon Terminal Complex",
    "Yuseong Express Bus Terminal"
  )]: 16000,
  [buildFareKey(
    "Daejeon Terminal Complex",
    "Yuseong Intercity Bus Terminal"
  )]: 16000,
  [buildFareKey(
    "Daejeon Terminal Complex",
    "Government Complex Express Bus Terminal"
  )]: 7000,
  [buildFareKey(
    "Daejeon Terminal Complex",
    "Government Complex Intercity Bus Terminal"
  )]: 7000,

  // Mannyon Middle School
  [buildFareKey("Mannyon Middle School", "Seodaejeon Station")]: 12000,
  [buildFareKey("Mannyon Middle School", "Shinsegae Department Store")]: 7000,
  [buildFareKey("Mannyon Middle School", "Duck Pond")]: 6000,
  [buildFareKey("Mannyon Middle School", "Wolpyeong Station")]: 6000,
  [buildFareKey("Mannyon Middle School", "Yuseong-gu Office")]: 6000,
  [buildFareKey("Mannyon Middle School", "Yuseong Express Bus Terminal")]: 8000,
  [buildFareKey(
    "Mannyon Middle School",
    "Yuseong Intercity Bus Terminal"
  )]: 8000,
  [buildFareKey(
    "Mannyon Middle School",
    "Government Complex Express Bus Terminal"
  )]: 10000,
  [buildFareKey(
    "Mannyon Middle School",
    "Government Complex Intercity Bus Terminal"
  )]: 10000,

  // Seodaejeon Station
  [buildFareKey("Seodaejeon Station", "Shinsegae Department Store")]: 12000,
  [buildFareKey("Seodaejeon Station", "Duck Pond")]: 14000,
  [buildFareKey("Seodaejeon Station", "Wolpyeong Station")]: 12000,
  [buildFareKey("Seodaejeon Station", "Yuseong-gu Office")]: 13000,
  [buildFareKey("Seodaejeon Station", "Yuseong Express Bus Terminal")]: 14000,
  [buildFareKey("Seodaejeon Station", "Yuseong Intercity Bus Terminal")]: 14000,
  [buildFareKey(
    "Seodaejeon Station",
    "Government Complex Express Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Seodaejeon Station",
    "Government Complex Intercity Bus Terminal"
  )]: 9000,

  // Shinsegae Department Store
  [buildFareKey("Shinsegae Department Store", "Duck Pond")]: 7000,
  [buildFareKey("Shinsegae Department Store", "Wolpyeong Station")]: 6000,
  [buildFareKey("Shinsegae Department Store", "Yuseong-gu Office")]: 7000,
  [buildFareKey(
    "Shinsegae Department Store",
    "Yuseong Express Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Shinsegae Department Store",
    "Yuseong Intercity Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Shinsegae Department Store",
    "Government Complex Express Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Shinsegae Department Store",
    "Government Complex Intercity Bus Terminal"
  )]: 9000,

  // Duck Pond
  [buildFareKey("Duck Pond", "Wolpyeong Station")]: 7000,
  [buildFareKey("Duck Pond", "Yuseong-gu Office")]: 7000,
  [buildFareKey("Duck Pond", "Yuseong Express Bus Terminal")]: 9000,
  [buildFareKey("Duck Pond", "Yuseong Intercity Bus Terminal")]: 9000,
  [buildFareKey("Duck Pond", "Government Complex Express Bus Terminal")]: 11000,
  [buildFareKey(
    "Duck Pond",
    "Government Complex Intercity Bus Terminal"
  )]: 11000,

  // Wolpyeong Station
  [buildFareKey("Wolpyeong Station", "Yuseong-gu Office")]: 6000,
  [buildFareKey("Wolpyeong Station", "Yuseong Express Bus Terminal")]: 8000,
  [buildFareKey("Wolpyeong Station", "Yuseong Intercity Bus Terminal")]: 8000,
  [buildFareKey(
    "Wolpyeong Station",
    "Government Complex Express Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Wolpyeong Station",
    "Government Complex Intercity Bus Terminal"
  )]: 9000,

  // Yuseong-gu Office
  [buildFareKey("Yuseong-gu Office", "Yuseong Express Bus Terminal")]: 8000,
  [buildFareKey("Yuseong-gu Office", "Yuseong Intercity Bus Terminal")]: 8000,
  [buildFareKey(
    "Yuseong-gu Office",
    "Government Complex Express Bus Terminal"
  )]: 9000,
  [buildFareKey(
    "Yuseong-gu Office",
    "Government Complex Intercity Bus Terminal"
  )]: 9000,

  // Yuseong Express Bus Terminal
  [buildFareKey(
    "Yuseong Express Bus Terminal",
    "Yuseong Intercity Bus Terminal"
  )]: 5000,
  [buildFareKey(
    "Yuseong Express Bus Terminal",
    "Government Complex Express Bus Terminal"
  )]: 11000,
  [buildFareKey(
    "Yuseong Express Bus Terminal",
    "Government Complex Intercity Bus Terminal"
  )]: 11000,

  // Yuseong Intercity Bus Terminal
  [buildFareKey(
    "Yuseong Intercity Bus Terminal",
    "Government Complex Express Bus Terminal"
  )]: 11000,
  [buildFareKey(
    "Yuseong Intercity Bus Terminal",
    "Government Complex Intercity Bus Terminal"
  )]: 11000,
};

export const DEFAULT_FARE = 12000;

export const getEstimatedFare = (fromName?: string, toName?: string) => {
  if (!fromName || !toName) return DEFAULT_FARE;
  const key = buildFareKey(fromName, toName);
  return ESTIMATED_FARE_TABLE[key] ?? DEFAULT_FARE;
};

type RoomWithNames = {
  from?: { enName?: string | null } | null;
  to?: { enName?: string | null } | null;
  part?: { user: unknown }[] | null;
};

export const getRoomSavings = (room: RoomWithNames) => {
  const fromName = room.from?.enName ?? undefined;
  const toName = room.to?.enName ?? undefined;
  const participantCount = room.part?.length ?? 0;
  if (!fromName || !toName || participantCount === 0) {
    logger.warn("Savings : missing location info or participants", {
      fromName,
      toName,
      participantCount,
    });
    return {
      estimatedFare: DEFAULT_FARE,
      savingsPerUser: 0,
      totalSavings: 0,
    };
  }

  const estimatedFare = getEstimatedFare(fromName, toName);
  const savingsPerUser =
    participantCount > 0
      ? (estimatedFare * (participantCount - 1)) / participantCount
      : 0;
  const totalSavings = savingsPerUser * participantCount;

  return { estimatedFare, savingsPerUser, totalSavings };
};
