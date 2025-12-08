-- ============================================
-- Export All Data from Local Database
-- Run this in your LOCAL database to generate INSERT statements
-- ============================================

-- Instructions:
-- 1. Connect to your local database using pgAdmin or psql
-- 2. Run this script
-- 3. Copy the output
-- 4. Save to a file (e.g., local_to_railway_export.sql)
-- 5. Run that file in Railway database

-- ============================================
-- 1. LEVELS (no dependencies)
-- ============================================
SELECT 'INSERT INTO levels (id, name, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (name) DO NOTHING;' as insert_statement
FROM levels
ORDER BY name;

-- ============================================
-- 2. USERS (no dependencies)
-- ============================================
SELECT 'INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(password) || ', ' ||
  COALESCE(quote_literal("universityId"), 'NULL') || ', ' ||
  quote_literal(role::text) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (email) DO NOTHING;' as insert_statement
FROM users
ORDER BY email;

-- ============================================
-- 3. ROOMS (no dependencies)
-- ============================================
SELECT 'INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  capacity || ', ' ||
  COALESCE(quote_literal(location), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (name) DO NOTHING;' as insert_statement
FROM rooms
ORDER BY name;

-- ============================================
-- 4. COURSES (depends on levels)
-- ============================================
SELECT 'INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(code) || ', ' ||
  quote_literal(name) || ', ' ||
  credits || ', ' ||
  quote_literal("levelId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (code) DO NOTHING;' as insert_statement
FROM courses
ORDER BY code;

-- ============================================
-- 5. SECTIONS (depends on courses, users, rooms)
-- ============================================
SELECT 'INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("instructorId") || ', ' ||
  COALESCE(quote_literal("roomId"), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM sections
ORDER BY name;

-- ============================================
-- 6. SECTION MEETINGS (depends on sections)
-- ============================================
SELECT 'INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("sectionId") || ', ' ||
  quote_literal("dayOfWeek") || ', ' ||
  quote_literal("startTime") || ', ' ||
  quote_literal("endTime") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM section_meetings
ORDER BY "sectionId", "dayOfWeek";

-- ============================================
-- 7. ASSIGNMENTS (depends on users, sections, courses)
-- ============================================
SELECT 'INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("studentId") || ', ' ||
  quote_literal("sectionId") || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT ("studentId", "sectionId") DO NOTHING;' as insert_statement
FROM assignments
ORDER BY "studentId", "sectionId";

-- ============================================
-- 8. PREFERENCES (depends on users)
-- ============================================
SELECT 'INSERT INTO preferences (id, "userId", type, value, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(type) || ', ' ||
  quote_literal(value) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM preferences
ORDER BY "userId", type;

-- ============================================
-- 9. FEEDBACK (depends on users)
-- ============================================
SELECT 'INSERT INTO feedback (id, "userId", content, rating, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(content) || ', ' ||
  COALESCE(rating::text, 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM feedback
ORDER BY "createdAt" DESC;

-- ============================================
-- 10. NOTIFICATIONS (depends on users)
-- ============================================
SELECT 'INSERT INTO notifications (id, "userId", title, message, read, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(title) || ', ' ||
  quote_literal(message) || ', ' ||
  read || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM notifications
ORDER BY "createdAt" DESC;

-- ============================================
-- 11. ROLES (if you have custom roles)
-- ============================================
SELECT 'INSERT INTO roles (id, name) VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ') ON CONFLICT (name) DO NOTHING;' as insert_statement
FROM roles
ORDER BY name;

-- ============================================
-- 12. SCHEDULE STATUSES (if you have schedules)
-- ============================================
SELECT 'INSERT INTO schedule_statuses (name, description, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (name) DO NOTHING;' as insert_statement
FROM schedule_statuses
ORDER BY name;

-- ============================================
-- END OF EXPORT
-- ============================================
-- Copy all the INSERT statements above and save to a file
-- Then run that file in your Railway database


