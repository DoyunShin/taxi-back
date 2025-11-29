import type { RequestHandler } from "express";
import { Types, type FilterQuery, type PipelineStage } from "mongoose";
import logger from "@/modules/logger";
import {
  dailySavingsModel,
  locationModel,
  roomModel,
  userModel,
  monthlyRoomCreationModel,
  monthlyUserCreationModel,
  type Room,
} from "@/modules/stores/mongo";
import { getRoomSavings } from "@/modules/savings";
import type {
  HourlyRoomCreationQuery,
  MonthlyRoomCreationQuery,
  MonthlyUserCreationQuery,
  SavingsPeriodQuery,
  SavingsQuery,
  UserDoneRoomCountQuery,
  UserSavingsQuery,
} from "@/routes/docs/schemas/statisticsSchema";

type PopulatedRoom = Room & {
  from?: { _id?: Types.ObjectId; enName?: string; koName?: string } | null;
  to?: { _id?: Types.ObjectId; enName?: string; koName?: string } | null;
};

export const startOfDayUTC = (date: Date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const SEOUL_TIMEZONE = "Asia/Seoul";
const DAY_MS = 86_400_000;
const START_OF_TRACKING = startOfDayUTC(new Date("2022-01-01T00:00:00Z"));
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const START_OF_MONTH_TRACKING = new Date(Date.UTC(2022, 10, 1, 0, 0, 0, 0)); // 2022-11-01

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const startOfDayKST = (date: Date) => {
  const ms = date.getTime() + KST_OFFSET_MS;
  const truncated = Math.floor(ms / DAY_MS) * DAY_MS;
  return new Date(truncated - KST_OFFSET_MS);
};

const startOfMonthKST = (date: Date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const utcMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return startOfDayKST(utcMonthStart);
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  return startOfMonthKST(new Date(Date.UTC(year, month + months, 1, 0, 0, 0, 0)));
};

const ensureMonthlyRoomsThrough = async (targetMonth: Date) => {
  if (targetMonth < START_OF_MONTH_TRACKING) return;

  const latest = await monthlyRoomCreationModel
    .findOne({ month: { $lte: targetMonth } })
    .sort({ month: -1 })
    .lean();

  let cursorMonth = latest
    ? addMonths(new Date(latest.month), 1)
    : START_OF_MONTH_TRACKING;

  if (cursorMonth > targetMonth) return;

  const cumulativeBase = latest?.cumulativeRooms ?? 0;
  const ops = [];
  let runningTotal = cumulativeBase;

  for (
    let month = cursorMonth.getTime();
    month <= targetMonth.getTime();
    month = addMonths(new Date(month), 1).getTime()
  ) {
    const monthStart = new Date(month);
    const nextMonth = addMonths(monthStart, 1);
    const count = await roomModel.countDocuments({
      madeat: { $gte: monthStart, $lt: nextMonth },
    });
    runningTotal += count;
    ops.push({
      updateOne: {
        filter: { month: monthStart },
        update: { month: monthStart, cumulativeRooms: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await monthlyRoomCreationModel.bulkWrite(ops);
  }
};

const ensureMonthlyUsersThrough = async (targetMonth: Date) => {
  if (targetMonth < START_OF_MONTH_TRACKING) return;

  const latest = await monthlyUserCreationModel
    .findOne({ month: { $lte: targetMonth } })
    .sort({ month: -1 })
    .lean();

  let cursorMonth = latest
    ? addMonths(new Date(latest.month), 1)
    : START_OF_MONTH_TRACKING;

  if (cursorMonth > targetMonth) return;

  const cumulativeBase = latest?.cumulativeUsers ?? 0;
  const ops = [];
  let runningTotal = cumulativeBase;

  for (
    let month = cursorMonth.getTime();
    month <= targetMonth.getTime();
    month = addMonths(new Date(month), 1).getTime()
  ) {
    const monthStart = new Date(month);
    const nextMonth = addMonths(monthStart, 1);
    const count = await userModel.countDocuments({
      joinat: { $gte: monthStart, $lt: nextMonth },
    });
    runningTotal += count;
    ops.push({
      updateOne: {
        filter: { month: monthStart },
        update: { month: monthStart, cumulativeUsers: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await monthlyUserCreationModel.bulkWrite(ops);
  }
};

export const getCumulativeAt = async (
  targetDay: Date,
  startHint?: Date
): Promise<number> => {
  const todayStart = startOfDayUTC(new Date());
  const day =
    targetDay >= todayStart ? addDays(todayStart, -1) : startOfDayUTC(targetDay);
  await ensureCumulativeSavingsThrough(day, startHint);
  const doc = await dailySavingsModel
    .findOne({ date: { $lte: day } })
    .sort({ date: -1 })
    .lean();
  return doc?.cumulativeSavings ?? 0;
};

export const ensureCumulativeSavingsThrough = async (
  targetDay: Date,
  startHint?: Date
) => {
  const todayStart = startOfDayUTC(new Date());
  // Never write today's row; cap at yesterday.
  const cappedTarget =
    targetDay >= todayStart ? addDays(todayStart, -1) : startOfDayUTC(targetDay);

  if (cappedTarget < START_OF_TRACKING) return;

  const target = cappedTarget;
  const latest = await dailySavingsModel
    .findOne({ date: { $lte: target } })
    .sort({ date: -1 })
    .lean();

  let cursorDate = latest
    ? addDays(new Date(latest.date), 1)
    : startHint
    ? startOfDayUTC(startHint)
    : undefined;
  if (!cursorDate) {
    const earliestRoom = await roomModel
      .findOne({}, { time: 1 })
      .sort({ time: 1 })
      .lean();
    if (!earliestRoom?.time) return;
    cursorDate = startOfDayUTC(new Date(earliestRoom.time));
  }
  // never backfill before tracking start
  if (cursorDate < START_OF_TRACKING) {
    cursorDate = START_OF_TRACKING;
  }
  cursorDate = startOfDayUTC(cursorDate);

  if (cursorDate > target) return;

  const cumulativeBase = latest?.cumulativeSavings ?? 0;
  const endExclusive = addDays(target, 1);

  const rooms = await roomModel
    .find({
      time: { $gte: cursorDate, $lt: endExclusive },
    })
    .sort({ time: 1 })
    .populate([
      { path: "from", select: "_id enName koName" },
      { path: "to", select: "_id enName koName" },
    ])
    .lean<PopulatedRoom[]>();

  const dayTotals = new Map<number, number>();
  for (const room of rooms) {
    const { totalSavings } = getRoomSavings(room);
    const dayKey = startOfDayUTC(new Date(room.time)).getTime();
    dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + totalSavings);
  }

  const ops = [];
  let runningTotal = cumulativeBase;
  for (
    let day = cursorDate.getTime();
    day < endExclusive.getTime();
    day += DAY_MS
  ) {
    runningTotal += dayTotals.get(day) ?? 0;
    ops.push({
      updateOne: {
        filter: { date: new Date(day) },
        update: { date: new Date(day), cumulativeSavings: runningTotal },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await dailySavingsModel.bulkWrite(ops);
  }
};

export const savingsHandler: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query as unknown as SavingsQuery;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Statistics/savings : invalid date format",
      });
    }

    if (start.getTime() > end.getTime()) {
      return res.status(400).json({
        error: "Statistics/savings : startDate is after endDate",
      });
    }

    if (userId) {
      const userExists = await userModel.exists({
        _id: userId,
        withdraw: false,
      });
      if (!userExists) {
        return res.status(404).json({
          error: "Statistics/savings : user not found",
        });
      }
    }

    const isTotalMode = !userId;
    const filter: FilterQuery<Room> = {
      time: { $gte: start, $lte: end },
    };
    if (!isTotalMode) {
      filter["part.user"] = new Types.ObjectId(userId);
    }

    const rooms = await roomModel
      .find(filter)
      .sort({ time: 1 })
      .populate([
        { path: "from", select: "_id enName koName" },
        { path: "to", select: "_id enName koName" },
      ])
      .lean<PopulatedRoom[]>();

    const roomSavings = [];
    let totalSavings = 0;

    for (const room of rooms) {
      const from = room.from;
      const to = room.to;

      if (!from || !to) {
        logger.warn(
          `Statistics/savings : room ${room._id} missing location info`
        );
        continue;
      }

      const participantCount = room.part?.length ?? 0;
      if (participantCount === 0) continue;

      const { estimatedFare, savingsPerUser } = getRoomSavings(room);
      const totalSavingsForRoom = isTotalMode
        ? savingsPerUser * participantCount
        : savingsPerUser;

      roomSavings.push({
        roomId: room._id.toString(),
        from: {
          id: from._id?.toString() ?? "",
          enName: from.enName,
          koName: from.koName,
        },
        to: {
          id: to._id?.toString() ?? "",
          enName: to.enName,
          koName: to.koName,
        },
        participantCount,
        estimatedFare,
        savingsPerUser,
        totalSavingsForRoom,
        departedAt: room.time,
      });

      totalSavings += totalSavingsForRoom;
    }

    return res.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      userId: userId ?? null,
      mode: isTotalMode ? "total" : "user",
      metric: "savings",
      currency: "KRW",
      totalSavings,
      rooms: roomSavings,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings : internal server error",
    });
  }
};

export const savingsByPeriodHandler: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query as unknown as SavingsPeriodQuery;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Statistics/savings/period : invalid date format",
      });
    }

    if (start.getTime() > end.getTime()) {
      return res.status(400).json({
        error: "Statistics/savings/period : startDate is after endDate",
      });
    }

    const startDay = startOfDayUTC(start);
    const endDay = startOfDayUTC(end);

    const cumulativeEnd = await getCumulativeAt(endDay, startDay);
    const cumulativeBeforeStart = await getCumulativeAt(
      addDays(startDay, -1),
      startDay
    );
    const periodSavings = cumulativeEnd - cumulativeBeforeStart;

    return res.json({
      metric: "savings-period",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSavings: periodSavings,
      cumulativeEnd,
      cumulativeBeforeStart,
      currency: "KRW",
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings/period : internal server error",
    });
  }
};

export const savingsTotalHandler: RequestHandler = async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDayUTC(now);
    const yesterday = addDays(todayStart, -1);

    // 어제까지의 누적 아낀 금액을 가져옴
    const cumulativeUntilYesterday = await getCumulativeAt(yesterday);

    // 오늘 누적 아낀 금액을 가져옴
    /*
    const todaysRooms = await roomModel
      .find({
        time: { $gte: todayStart, $lte: now },
      })
      .populate([
        { path: "from", select: "_id enName koName" },
        { path: "to", select: "_id enName koName" },
      ])
      .lean<PopulatedRoom[]>();

    const todaySavings = todaysRooms.reduce((sum, room) => {
      const { totalSavings } = getRoomSavings(room);
      return sum + totalSavings;
    }, 0);
    */

    const totalSavings = cumulativeUntilYesterday; // + todaySavings;

    return res.json({
      metric: "savings-total",
      asOf: now.toISOString(),
      currency: "KRW",
      totalSavings,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/savings/total : internal server error",
    });
  }
};

const calculateUserSavings = async (userId: Types.ObjectId) => {
  const rooms = await roomModel
    .find({
      part: {
        $elemMatch: {
          user: userId,
          settlementStatus: { $in: ["paid", "sent"] },
        },
      },
    })
    .populate([
      { path: "from", select: "_id enName koName" },
      { path: "to", select: "_id enName koName" },
    ])
    .lean<PopulatedRoom[]>();

  return rooms.reduce((sum, room) => {
    const { savingsPerUser } = getRoomSavings(room);
    return sum + savingsPerUser;
  }, 0);
};

export const userSavingsHandler: RequestHandler = async (req, res) => {
  try {
  const { userId } = req.query as unknown as UserSavingsQuery;
  const user = await userModel.findOne({ _id: userId, withdraw: false });
  if (!user) {
      return res
        .status(404)
        .json({ error: "Statistics/users/savings : user not found" });
    }

    if (user.savings === null || user.savings === undefined) {
      const totalSavings = await calculateUserSavings(user._id);
      user.savings = totalSavings;
      await user.save();
    }

    return res.json({
      metric: "user-savings",
      userId: user._id.toString(),
      currency: "KRW",
      totalSavings: user.savings ?? 0,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/savings : internal server error",
    });
  }
};

export const userDoneRoomCountHandler: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.query as unknown as UserDoneRoomCountQuery;
    const user = await userModel.findOne({ _id: userId, withdraw: false });
    if (!user) {
      return res
        .status(404)
        .json({ error: "Statistics/users/done-room-count : user not found" });
    }

    return res.json({
      metric: "user-done-room-count",
      userId: user._id.toString(),
      doneRoomCount: user.doneRoom?.length ?? 0,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/done-room-count : internal server error",
    });
  }
};

export const monthlyRoomCreationHandler: RequestHandler = async (_req, res) => {
  try {
    const todayKST = startOfMonthKST(new Date());
    const lastMonthStart = addMonths(todayKST, -1);

    if (lastMonthStart < START_OF_MONTH_TRACKING) {
      return res.json({
        metric: "monthly-room-creation",
        timezone: SEOUL_TIMEZONE,
        range: null,
        months: [],
      });
    }

    await ensureMonthlyRoomsThrough(lastMonthStart);

    const months = await monthlyRoomCreationModel
      .find({ month: { $lte: lastMonthStart } })
      .sort({ month: 1 })
      .lean();

    const responseMonths = months.map((doc) => ({
      month: doc.month.toISOString(),
      cumulativeRooms: doc.cumulativeRooms,
    }));

    return res.json({
      metric: "monthly-room-creation",
      timezone: SEOUL_TIMEZONE,
      range: {
        startMonth: responseMonths[0]?.month ?? null,
        endMonth: responseMonths.at(-1)?.month ?? null,
      },
      months: responseMonths,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/room-creation/monthly : internal server error",
    });
  }
};

export const monthlyUserCreationHandler: RequestHandler = async (_req, res) => {
  try {
    const todayKST = startOfMonthKST(new Date());
    const lastMonthStart = addMonths(todayKST, -1);

    if (lastMonthStart < START_OF_MONTH_TRACKING) {
      return res.json({
        metric: "monthly-user-creation",
        timezone: SEOUL_TIMEZONE,
        range: null,
        months: [],
      });
    }

    await ensureMonthlyUsersThrough(lastMonthStart);

    const months = await monthlyUserCreationModel
      .find({ month: { $lte: lastMonthStart } })
      .sort({ month: 1 })
      .lean();

    const responseMonths = months.map((doc) => ({
      month: doc.month.toISOString(),
      cumulativeUsers: doc.cumulativeUsers,
    }));

    return res.json({
      metric: "monthly-user-creation",
      timezone: SEOUL_TIMEZONE,
      range: {
        startMonth: responseMonths[0]?.month ?? null,
        endMonth: responseMonths.at(-1)?.month ?? null,
      },
      months: responseMonths,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/users/monthly : internal server error",
    });
  }
};

export const hourlyRoomCreationHandler: RequestHandler = async (req, res) => {
  try {
    const { locationId, dayOfWeek } =
      req.query as unknown as HourlyRoomCreationQuery;

    // Fixed window: last 28 days (yesterday back 27), in KST.
    const todayKST = startOfDayKST(new Date());
    const endExclusive = todayKST;
    const start = addDays(endExclusive, -28);

    const location = await locationModel
      .findById(locationId, "enName koName")
      .lean();
    if (!location) {
      return res.status(404).json({
        error: "Statistics/hourly-room-creation : location not found",
      });
    }

    const locationObjectId = new Types.ObjectId(locationId);
    const targetDayOfWeek = dayOfWeek + 1; // MongoDB dayOfWeek starts from 1 (Sunday)

    const aggregationPipeline: PipelineStage[] = [
      {
        $match: {
          $or: [{ from: locationObjectId }, { to: locationObjectId }],
          time: { $type: "date", $gte: start, $lt: endExclusive },
        },
      },
      {
        $addFields: {
          dayOfWeek: {
            $dayOfWeek: { date: "$time", timezone: SEOUL_TIMEZONE },
          },
        },
      },
      { $match: { dayOfWeek: targetDayOfWeek } },
      {
        $facet: {
          hourly: [
            {
              $group: {
                _id: {
                  hour: {
                    $hour: { date: "$time", timezone: SEOUL_TIMEZONE },
                  },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ];

    const [aggregationResult] = await roomModel.aggregate<{
      hourly: { _id: { hour: number }; count: number }[];
      days: { value: number }[];
    }>(aggregationPipeline);

    const hourlyCounts = Array(24).fill(0);
    const hourly = aggregationResult?.hourly ?? [];
    for (const entry of hourly) {
      const hour = entry?._id?.hour;
      if (typeof hour === "number" && hour >= 0 && hour < 24) {
        hourlyCounts[hour] = entry.count ?? 0;
      }
    }

    const intervals = hourlyCounts.map((totalRooms, hour) => ({
      hour,
      timeRange: `${String(hour).padStart(2, "0")}:00-${String(
        hour + 1
      ).padStart(2, "0")}:00`,
      totalRooms,
    }));

    return res.json({
      metric: "hourly-room-creation",
      timezone: SEOUL_TIMEZONE,
      startDate: start.toISOString(),
      endDate: new Date(endExclusive.getTime() - 1).toISOString(),
      location: {
        id: location._id.toString(),
        enName: location.enName,
        koName: location.koName,
      },
      dayOfWeek,
      intervals,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      error: "Statistics/hourly-room-creation : internal server error",
    });
  }
};
