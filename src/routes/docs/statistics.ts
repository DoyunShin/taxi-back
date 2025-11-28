const tag = "statistics";
const apiPrefix = "/statistics";
const { objectId } = require("@/modules/patterns").default;

const statisticsDocs: Record<string, any> = {};

statisticsDocs[`${apiPrefix}/savings`] = {
  get: {
    tags: [tag],
    summary: "아낀 금액 조회",
    description: "아낀 금액(savings)을 계산합니다.",
    parameters: [
      {
        in: "query",
        name: "startDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 시작 시각",
        example: "2025-01-01T00:00:00.000Z",
      },
      {
        in: "query",
        name: "endDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 종료 시각",
        example: "2025-01-31T23:59:59.000Z",
      },
      {
        in: "query",
        name: "userId",
        required: false,
        schema: { type: "string", pattern: objectId.source },
        description:
          "아낀 금액을 조회할 사용자 ObjectId. 미제공 시 전체 사용자 합계를 반환합니다.",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                userId: { type: ["string", "null"] },
                metric: {
                  type: "string",
                  description: "지표 유형",
                  example: "savings",
                },
                mode: { type: "string", enum: ["total", "user"] },
                currency: { type: "string" },
                totalSavings: { type: "number" },
                rooms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      roomId: { type: "string" },
                      from: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          enName: { type: "string" },
                          koName: { type: "string" },
                        },
                      },
                      to: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          enName: { type: "string" },
                          koName: { type: "string" },
                        },
                      },
                      participantCount: { type: "number" },
                      estimatedFare: { type: "number" },
                      savingsPerUser: { type: "number" },
                      totalSavingsForRoom: { type: "number" },
                      departedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            example: {
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: "2025-01-31T23:59:59.000Z",
              userId: "665b4d2c7c6f3fd1c1234567",
              metric: "savings",
              mode: "user",
              currency: "KRW",
              totalSavings: 12000,
              rooms: [
                {
                  roomId: "665b4d2c7c6f3fd1c0000000",
                  from: {
                    id: "665b4d2c7c6f3fd1c0000001",
                    enName: "Taxi Stand",
                    koName: "택시승강장",
                  },
                  to: {
                    id: "665b4d2c7c6f3fd1c0000002",
                    enName: "Daejeon Station",
                    koName: "대전역",
                  },
                  participantCount: 3,
                  estimatedFare: 18000,
                  savingsPerUser: 12000,
                  totalSavingsForRoom: 12000,
                  departedAt: "2025-01-12T03:00:00.000Z",
                },
              ],
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Statistics/savings : invalid date format",
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/savings : user not found",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/savings : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/room-creation/hourly-average`] = {
  get: {
    tags: [tag],
    summary: "시간대별 방 생성 평균",
    description:
      "특정 위치와 요일에 대해 1시간 간격으로 방 생성 평균을 계산합니다.",
    parameters: [
      {
        in: "query",
        name: "locationId",
        required: true,
        schema: { type: "string", pattern: objectId.source },
        description: "출발지 또는 도착지 위치 ObjectId",
      },
      {
        in: "query",
        name: "startDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 시작 시각 (포함)",
        example: "2025-01-01T00:00:00.000Z",
      },
      {
        in: "query",
        name: "endDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 종료 시각 (포함)",
        example: "2025-01-31T23:59:59.000Z",
      },
      {
        in: "query",
        name: "dayOfWeek",
        required: true,
        schema: { type: "integer", minimum: 0, maximum: 6 },
        description: "요일 (일요일=0, 월요일=1, ... 토요일=6)",
        example: 3,
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "hourly-room-creation" },
                timezone: { type: "string", example: "Asia/Seoul" },
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                location: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    enName: { type: "string" },
                    koName: { type: "string" },
                  },
                },
                dayOfWeek: {
                  type: "integer",
                  minimum: 0,
                  maximum: 6,
                },
                consideredDays: { type: "integer" },
                intervals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hour: {
                        type: "integer",
                        minimum: 0,
                        maximum: 23,
                        description: "구간 시작 시각(시)",
                      },
                      timeRange: { type: "string" },
                      averageRooms: { type: "number" },
                    },
                  },
                },
              },
            },
            example: {
              metric: "hourly-room-creation",
              timezone: "Asia/Seoul",
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: "2025-01-31T23:59:59.000Z",
              location: {
                id: "665b4d2c7c6f3fd1c0000001",
                enName: "Taxi Stand",
                koName: "택시승강장",
              },
              dayOfWeek: 3,
              consideredDays: 3,
              intervals: [
                { hour: 0, timeRange: "00:00-01:00", averageRooms: 0 },
                { hour: 1, timeRange: "01:00-02:00", averageRooms: 0 },
                { hour: 2, timeRange: "02:00-03:00", averageRooms: 0 },
                { hour: 3, timeRange: "03:00-04:00", averageRooms: 0 },
                { hour: 4, timeRange: "04:00-05:00", averageRooms: 0 },
                { hour: 5, timeRange: "05:00-06:00", averageRooms: 0 },
                { hour: 6, timeRange: "06:00-07:00", averageRooms: 0 },
                { hour: 7, timeRange: "07:00-08:00", averageRooms: 0 },
                { hour: 8, timeRange: "08:00-09:00", averageRooms: 0 },
                { hour: 9, timeRange: "09:00-10:00", averageRooms: 0 },
                { hour: 10, timeRange: "10:00-11:00", averageRooms: 0 },
                { hour: 11, timeRange: "11:00-12:00", averageRooms: 0 },
                { hour: 12, timeRange: "12:00-13:00", averageRooms: 0 },
                { hour: 13, timeRange: "13:00-14:00", averageRooms: 1 },
                { hour: 14, timeRange: "14:00-15:00", averageRooms: 0 },
                { hour: 15, timeRange: "15:00-16:00", averageRooms: 0 },
                { hour: 16, timeRange: "16:00-17:00", averageRooms: 0 },
                { hour: 17, timeRange: "17:00-18:00", averageRooms: 0 },
                { hour: 18, timeRange: "18:00-19:00", averageRooms: 0 },
                { hour: 19, timeRange: "19:00-20:00", averageRooms: 0 },
                { hour: 20, timeRange: "20:00-21:00", averageRooms: 0 },
                { hour: 21, timeRange: "21:00-22:00", averageRooms: 0 },
                { hour: 22, timeRange: "22:00-23:00", averageRooms: 0 },
                { hour: 23, timeRange: "23:00-24:00", averageRooms: 0 },
              ],
            },
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/hourly-room-creation : location not found",
          },
        },
      },
      400: {
        content: {
          "text/html": {
            examples: {
              invalidDate: {
                summary: "잘못된 날짜 형식",
                value:
                  "Statistics/hourly-room-creation : invalid date format",
              },
              reversedRange: {
                summary: "잘못된 기간",
                value:
                  "Statistics/hourly-room-creation : startDate is after endDate",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/hourly-room-creation : internal server error",
          },
        },
      },
    },
  },
};

export default statisticsDocs;
