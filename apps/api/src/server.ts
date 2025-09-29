import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

const prisma = new PrismaClient();

const GenerateRequest = z.object({ seed: z.number().int().nonnegative().default(1) });
app.post("/api/generate", async (req, res) => {
  const parsed = GenerateRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { seed } = parsed.data;
  // deterministic draft schedule
  const version = 1;
  const schedule = await prisma.schedule.create({
    data: { version, status: "draft", createdBy: "system" },
  });
  // minimal assignments: attach first few sections to first few slots/rooms
  const [sections, slots, rooms] = await Promise.all([
    prisma.section.findMany({ take: 3 }),
    prisma.timeSlot.findMany({ take: 3 }),
    prisma.room.findMany({ take: 3 }),
  ]);
  const assignmentsData = sections.map((s, i) => ({
    scheduleId: schedule.id,
    sectionId: s.id,
    timeslotId: slots[i % slots.length]?.id ?? slots[0]?.id!,
    roomId: rooms[i % rooms.length]?.id ?? rooms[0]?.id!,
  }));
  if (assignmentsData.length > 0) {
    await prisma.assignment.createMany({ data: assignmentsData });
  }
  res.json({ scheduleId: schedule.id, version });
});

app.get("/api/recommendations", async (req, res) => {
  const studentId = String(req.query.studentId || "");
  // mock provider controlled by env
  if (!studentId) return res.status(400).json({ error: "studentId required" });
  const mock = {
    studentId,
    electives: [
      { courseId: "C4", reason: "Elective time preference" },
      { courseId: "C3", reason: "Prereq progression" },
    ],
  };
  res.json(mock);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, "API server listening");
});
