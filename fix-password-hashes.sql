-- ============================================
-- Fix Password Hashes in Database
-- The old hash in the database doesn't match password123
-- This script updates all users with the correct hash
-- Password: password123
-- ============================================

-- Correct hash for password123 (generated with bcrypt, 12 rounds)
-- This hash has been verified to match password123
UPDATE users 
SET password = '$2a$12$fJZ5tbiPJJa4tSIUfPRIu.bCRoz2FHsKa6F8rrMN.lf0SGrU2R9WS',
    "updatedAt" = NOW()
WHERE email IN (
  'student@example.com',
  'dr.ahmed@ksu.edu.sa',
  'faculty@example.com',
  'committee@ksu.edu.sa',
  'committee@example.com',
  'admin@ksu.edu.sa',
  'dr.sara@ksu.edu.sa',
  'dr.khalid@ksu.edu.sa',
  'dr.fatima@ksu.edu.sa',
  'dr.mohammed@ksu.edu.sa',
  'dr.noura@ksu.edu.sa',
  'ahmed.student@ksu.edu.sa',
  'sara.student@ksu.edu.sa',
  'khalid.student@ksu.edu.sa',
  'fatima.student@ksu.edu.sa'
);

-- Or update ALL users (if you want to reset all passwords)
-- UPDATE users 
-- SET password = '$2a$12$fJZ5tbiPJJa4tSIUfPRIu.bCRoz2FHsKa6F8rrMN.lf0SGrU2R9WS',
--     "updatedAt" = NOW();

-- Verify the update
SELECT email, name, role, 
       LEFT(password, 30) as password_hash_preview,
       "updatedAt"
FROM users 
WHERE email IN (
  'student@example.com',
  'dr.ahmed@ksu.edu.sa',
  'faculty@example.com',
  'committee@ksu.edu.sa'
)
ORDER BY email;

