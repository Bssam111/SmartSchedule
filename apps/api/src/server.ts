import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { parse } from "csv-parse/sync";

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const prisma = new PrismaClient();

// Recommendation service (env-toggle mock)
interface RecommendationService {
  recommendForStudent(studentId: string): Promise<{ studentId: string; electives: Array<{ courseId: string; reason: string }> }>;
}
class MockRecommendationService implements RecommendationService {
  async recommendForStudent(studentId: string) {
    return {
      studentId,
      electives: [
        { courseId: "C4", reason: "Elective time preference" },
        { courseId: "C3", reason: "Prereq progression" },
      ],
    };
  }
}
const recoProvider: RecommendationService = new MockRecommendationService();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

// Imports: levels CSV
app.post("/api/import/levels", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file required" });
  const csv = req.file.buffer.toString("utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  for (const r of rows) {
    await prisma.level.upsert({
      where: { id: r.id },
      update: { name: r.name, studentCountTarget: Number(r.studentCountTarget) },
      create: { id: r.id, name: r.name, studentCountTarget: Number(r.studentCountTarget) },
    });
  }
  res.json({ imported: rows.length });
});

// Rules: list and update
app.get("/api/rules", async (_req, res) => {
  const rules = await prisma.rule.findMany();
  res.json(rules);
});

app.put("/api/rules/:id", async (req, res) => {
  const id = String(req.params.id);
  const Body = z.object({ key: z.string(), value: z.any(), active: z.boolean().default(true) });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { key, value, active } = parsed.data;
  const rule = await prisma.rule.upsert({ where: { id }, update: { key, value, active }, create: { id, key, value, active } });
  res.json(rule);
});

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
  if (!studentId) return res.status(400).json({ error: "studentId required" });
  const result = await recoProvider.recommendForStudent(studentId);
  res.json(result);
});

// Dashboards (MVP)
app.get("/api/dashboard/level", async (_req, res) => {
  const levels = await prisma.level.findMany({ include: { sections: true } });
  const payload = levels.map((l) => ({ name: l.name, sections: l.sections.length, target: l.studentCountTarget }));
  res.json(payload);
});

app.get("/api/dashboard/course", async (_req, res) => {
  const courses = await prisma.course.findMany({ include: { sections: true } });
  const payload = courses.map((c) => ({ code: c.code, sections: c.sections.length }));
  res.json(payload);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  logger.info({ port }, "API server listening");
});
