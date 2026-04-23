import express from "express";
import { getStatusSummary } from "../services/statusAggregator";

export const statusRouter = express.Router();

statusRouter.get("/", (_req, res) => {
  const summary = getStatusSummary();
  return res.json({ data: summary });
});
