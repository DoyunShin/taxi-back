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

export default statisticsDocs;
