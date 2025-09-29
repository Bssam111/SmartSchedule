import { PrismaClient, Role } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function readCsv(file: string) {
	const full = path.resolve(__dirname, "../../seed", file);
	const content = fs.readFileSync(full, "utf8");
	return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

async function main() {
	const levels = readCsv("levels.csv");
	for (const l of levels) {
		await prisma.level.upsert({
			where: { id: l.id },
			update: { name: l.name, studentCountTarget: Number(l.studentCountTarget) },
			create: { id: l.id, name: l.name, studentCountTarget: Number(l.studentCountTarget) },
		});
	}

	const users = readCsv("users.csv");
	for (const u of users) {
		await prisma.user.upsert({
			where: { id: u.id },
			update: { name: u.name, email: u.email, role: u.role as Role, password: u.password },
			create: { id: u.id, name: u.name, email: u.email, role: u.role as Role, password: u.password },
		});
	}

	const rooms = readCsv("rooms.csv");
	for (const r of rooms) {
		await prisma.room.upsert({
			where: { id: r.id },
			update: { name: r.name, capacity: Number(r.capacity), type: r.type },
			create: { id: r.id, name: r.name, capacity: Number(r.capacity), type: r.type },
		});
	}

	const courses = readCsv("courses.csv");
	for (const c of courses) {
		await prisma.course.upsert({
			where: { id: c.id },
			update: {
				code: c.code,
				name: c.name,
				levelId: c.levelId,
				credit: Number(c.credit),
				isElective: String(c.isElective).toLowerCase() === "true",
				prerequisites: c.prerequisites ? String(c.prerequisites).split(";").filter(Boolean) : [],
			},
			create: {
				id: c.id,
				code: c.code,
				name: c.name,
				levelId: c.levelId,
				credit: Number(c.credit),
				isElective: String(c.isElective).toLowerCase() === "true",
				prerequisites: c.prerequisites ? String(c.prerequisites).split(";").filter(Boolean) : [],
			},
		});
	}

	const timeslots = readCsv("timeslots.csv");
	for (const t of timeslots) {
		await prisma.timeSlot.upsert({
			where: { id: t.id },
			update: {
				dayOfWeek: Number(t.dayOfWeek),
				start: t.start,
				end: t.end,
				isMidtermBlock: String(t.isMidtermBlock).toLowerCase() === "true",
				isBreak: String(t.isBreak).toLowerCase() === "true",
			},
			create: {
				id: t.id,
				dayOfWeek: Number(t.dayOfWeek),
				start: t.start,
				end: t.end,
				isMidtermBlock: String(t.isMidtermBlock).toLowerCase() === "true",
				isBreak: String(t.isBreak).toLowerCase() === "true",
			},
		});
	}

	const sections = readCsv("sections.csv");
	for (const s of sections) {
		await prisma.section.upsert({
			where: { id: s.id },
			update: {
				courseId: s.courseId,
				number: Number(s.number),
				capacity: Number(s.capacity),
				roomId: s.roomId || null,
				instructorId: s.instructorId || null,
				levelId: s.levelId,
			},
			create: {
				id: s.id,
				courseId: s.courseId,
				number: Number(s.number),
				capacity: Number(s.capacity),
				roomId: s.roomId || null,
				instructorId: s.instructorId || null,
				levelId: s.levelId,
			},
		});
	}

	await prisma.rule.upsert({
		where: { id: "break" },
		update: { key: "breakWindow", value: { start: "12:00", end: "13:00" }, active: true },
		create: { id: "break", key: "breakWindow", value: { start: "12:00", end: "13:00" }, active: true },
	});
	await prisma.rule.upsert({
		where: { id: "midterm" },
		update: { key: "midtermBlock", value: { days: [1, 3], start: "12:00", end: "14:00" }, active: true },
		create: { id: "midterm", key: "midtermBlock", value: { days: [1, 3], start: "12:00", end: "14:00" }, active: true },
	});
}

main()
	.then(() => prisma.$disconnect())
	.catch((e) => {
		console.error(e);
		return prisma.$disconnect().finally(() => process.exit(1));
	});


