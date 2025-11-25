import * as cron from "node-cron";
import { getFareRoutine } from "./getTaxiFare";

export const registerSchedules = () => {
  cron.schedule("*/30 * * * *", getFareRoutine);
};
