import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import { z } from "zod";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

const GenerateRequest = z.object({ seed: z.number().int().nonnegative().default(1) });
app.post("/api/generate", (req, res) => {
  const parsed = GenerateRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { seed } = parsed.data;
  const scheduleId = `demo-${seed}`;
  res.json({ scheduleId });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, "API server listening");
});
