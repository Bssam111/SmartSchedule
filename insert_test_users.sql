-- ============================================
-- Insert Test Users for SmartSchedule
-- Student, Faculty, and Committee users
-- All passwords are: password123
-- ============================================

-- Insert a level if it doesn't exist (required for courses)
INSERT INTO levels (id, name, "createdAt", "updatedAt")
VALUES ('level-1', 'Undergraduate', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Insert Student User
-- ============================================
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'student-1',
  'student@example.com',
  'John Student',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'STU001',
  'STUDENT',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Insert Faculty User
-- ============================================
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'faculty-1',
  'faculty@example.com',
  'Dr. Jane Faculty',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'FAC001',
  'FACULTY',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Insert Committee User
-- ============================================
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'committee-1',
  'committee@example.com',
  'Admin Committee',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'COM001',
  'COMMITTEE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Verification Query (run this to see the inserted users)
-- ============================================
-- SELECT id, email, name, role, "universityId" FROM users WHERE email IN (
--   'student@example.com',
--   'faculty@example.com',
--   'committee@example.com'
-- );


