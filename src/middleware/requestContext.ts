import crypto from "node:crypto";
import pinoHttp from "pino-http";
import { logger } from "../observability/logger";

export const requestContext = pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID()
});
