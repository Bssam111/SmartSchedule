-- ============================================
-- Complete Database Seed Script
-- Populates Railway database with mock data
-- Based on Software Engineering curriculum
-- ============================================

-- ============================================
-- OPTION 1: Clear existing data first (uncomment if you want fresh start)
-- ============================================
-- TRUNCATE TABLE assignments, section_meetings, sections, courses, rooms, time_slots, users, levels CASCADE;

-- ============================================
-- OPTION 2: Delete specific records (if you want to keep some data)
-- ============================================
-- DELETE FROM assignments;
-- DELETE FROM section_meetings;
-- DELETE FROM sections;
-- DELETE FROM courses;
-- DELETE FROM rooms;
-- DELETE FROM time_slots;
-- DELETE FROM users WHERE role != 'COMMITTEE'; -- Keep committee users
-- DELETE FROM levels;

-- ============================================
-- 1. LEVELS (Academic Levels/Years)
-- ============================================
INSERT INTO levels (id, name, "createdAt", "updatedAt") VALUES
('level-1', 'Undergraduate - First Year', NOW(), NOW()),
('level-2', 'Undergraduate - Second Year', NOW(), NOW()),
('level-3', 'Undergraduate - Third Year', NOW(), NOW()),
('level-4', 'Undergraduate - Fourth Year', NOW(), NOW()),
('level-grad', 'Graduate', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. USERS (Students, Faculty, Committee)
-- ============================================

-- Committee Users
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES
('committee-1', 'committee@ksu.edu.sa', 'Academic Committee', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COM001', 'COMMITTEE', NOW(), NOW()),
('committee-2', 'admin@ksu.edu.sa', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COM002', 'COMMITTEE', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Faculty Users
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES
('faculty-1', 'dr.ahmed@ksu.edu.sa', 'Dr. Ahmed Al-Mansouri', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC001', 'FACULTY', NOW(), NOW()),
('faculty-2', 'dr.sara@ksu.edu.sa', 'Dr. Sara Al-Rashid', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC002', 'FACULTY', NOW(), NOW()),
('faculty-3', 'dr.khalid@ksu.edu.sa', 'Dr. Khalid Al-Zahrani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC003', 'FACULTY', NOW(), NOW()),
('faculty-4', 'dr.fatima@ksu.edu.sa', 'Dr. Fatima Al-Otaibi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC004', 'FACULTY', NOW(), NOW()),
('faculty-5', 'dr.mohammed@ksu.edu.sa', 'Dr. Mohammed Al-Saud', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC005', 'FACULTY', NOW(), NOW()),
('faculty-6', 'dr.noura@ksu.edu.sa', 'Dr. Noura Al-Mutairi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FAC006', 'FACULTY', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Student Users
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES
('student-1', 'student@example.com', 'John Student', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STU001', 'STUDENT', NOW(), NOW()),
('student-2', 'ahmed.student@ksu.edu.sa', 'Ahmed Al-Mutairi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STU002', 'STUDENT', NOW(), NOW()),
('student-3', 'sara.student@ksu.edu.sa', 'Sara Al-Rashid', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STU003', 'STUDENT', NOW(), NOW()),
('student-4', 'khalid.student@ksu.edu.sa', 'Khalid Al-Zahrani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STU004', 'STUDENT', NOW(), NOW()),
('student-5', 'fatima.student@ksu.edu.sa', 'Fatima Al-Otaibi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STU005', 'STUDENT', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. ROOMS
-- ============================================
INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt") VALUES
('room-101', 'Room 101', 30, 'Building A - First Floor', NOW(), NOW()),
('room-102', 'Room 102', 30, 'Building A - First Floor', NOW(), NOW()),
('room-201', 'Room 201', 40, 'Building A - Second Floor', NOW(), NOW()),
('room-202', 'Room 202', 40, 'Building A - Second Floor', NOW(), NOW()),
('room-301', 'Room 301', 50, 'Building A - Third Floor', NOW(), NOW()),
('room-302', 'Room 302', 50, 'Building A - Third Floor', NOW(), NOW()),
('lab-101', 'Computer Lab 101', 25, 'Building B - First Floor', NOW(), NOW()),
('lab-102', 'Computer Lab 102', 25, 'Building B - First Floor', NOW(), NOW()),
('lab-201', 'Computer Lab 201', 30, 'Building B - Second Floor', NOW(), NOW()),
('auditorium-1', 'Main Auditorium', 200, 'Building C - Ground Floor', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. TIME SLOTS
-- ============================================
INSERT INTO time_slots (id, "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('slot-1', 'Sunday', '08:00', '09:30', NOW(), NOW()),
('slot-2', 'Sunday', '09:30', '11:00', NOW(), NOW()),
('slot-3', 'Sunday', '11:00', '12:30', NOW(), NOW()),
('slot-4', 'Sunday', '12:30', '14:00', NOW(), NOW()),
('slot-5', 'Sunday', '14:00', '15:30', NOW(), NOW()),
('slot-6', 'Monday', '08:00', '09:30', NOW(), NOW()),
('slot-7', 'Monday', '09:30', '11:00', NOW(), NOW()),
('slot-8', 'Monday', '11:00', '12:30', NOW(), NOW()),
('slot-9', 'Monday', '12:30', '14:00', NOW(), NOW()),
('slot-10', 'Monday', '14:00', '15:30', NOW(), NOW()),
('slot-11', 'Tuesday', '08:00', '09:30', NOW(), NOW()),
('slot-12', 'Tuesday', '09:30', '11:00', NOW(), NOW()),
('slot-13', 'Tuesday', '11:00', '12:30', NOW(), NOW()),
('slot-14', 'Tuesday', '12:30', '14:00', NOW(), NOW()),
('slot-15', 'Tuesday', '14:00', '15:30', NOW(), NOW()),
('slot-16', 'Wednesday', '08:00', '09:30', NOW(), NOW()),
('slot-17', 'Wednesday', '09:30', '11:00', NOW(), NOW()),
('slot-18', 'Wednesday', '11:00', '12:30', NOW(), NOW()),
('slot-19', 'Wednesday', '12:30', '14:00', NOW(), NOW()),
('slot-20', 'Wednesday', '14:00', '15:30', NOW(), NOW()),
('slot-21', 'Thursday', '08:00', '09:30', NOW(), NOW()),
('slot-22', 'Thursday', '09:30', '11:00', NOW(), NOW()),
('slot-23', 'Thursday', '11:00', '12:30', NOW(), NOW()),
('slot-24', 'Thursday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. COURSES (Based on Software Engineering Curriculum)
-- ============================================

-- First Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-arab100', 'ARAB 100', 'Writing Skills', 2, 'level-1', NOW(), NOW()),
('course-ent101', 'ENT 101', 'Entrepreneurship', 2, 'level-1', NOW(), NOW()),
('course-ct101', 'CT 101', 'Computer Skills and Artificial Intelligence', 3, 'level-1', NOW(), NOW()),
('course-math101', 'MATH 101', 'Differential Calculus', 3, 'level-1', NOW(), NOW()),
('course-engs100', 'ENGS 100', 'English Language', 3, 'level-1', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Second Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-ci101', 'CI 101', 'University Skills', 2, 'level-1', NOW(), NOW()),
('course-engs110', 'ENGS 110', 'English', 3, 'level-1', NOW(), NOW()),
('course-stat101', 'STAT 101', 'Introduction to Probability and Statistics', 3, 'level-1', NOW(), NOW()),
('course-chem101', 'CHEM 101', 'General Chemistry (1)', 3, 'level-1', NOW(), NOW()),
('course-eph101', 'EPH 101', 'Fitness and Health Education', 1, 'level-1', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Third Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-csc111', 'CSC 111', 'Computer Programming (1)', 4, 'level-2', NOW(), NOW()),
('course-math106', 'MATH 106', 'Integral Calculus', 3, 'level-2', NOW(), NOW()),
('course-phys103', 'PHYS 103', 'General Physics (1)', 3, 'level-2', NOW(), NOW()),
('course-math151', 'MATH 151', 'Discrete Mathematics', 3, 'level-2', NOW(), NOW()),
('course-math244', 'MATH 244', 'Linear Algebra', 3, 'level-2', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Fourth Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-phys104', 'PHYS 104', 'General Physics (2)', 3, 'level-2', NOW(), NOW()),
('course-swe211', 'SWE 211', 'Introduction to Software Engineering', 3, 'level-2', NOW(), NOW()),
('course-cenx303', 'CENX 303', 'Computer Communications & Networks', 3, 'level-2', NOW(), NOW()),
('course-csc113', 'CSC 113', 'Computer Programming -2-', 4, 'level-2', NOW(), NOW()),
('course-csc220', 'CSC 220', 'Computer Organization', 3, 'level-2', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Fifth Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-swe312', 'SWE 312', 'Software Requirements Engineering', 3, 'level-3', NOW(), NOW()),
('course-swe314', 'SWE 314', 'Software Security Engineering', 3, 'level-3', NOW(), NOW()),
('course-csc212', 'CSC 212', 'Data Structures', 4, 'level-3', NOW(), NOW()),
('course-is230', 'IS 230', 'Introduction to Database Systems', 3, 'level-3', NOW(), NOW()),
('course-swe381', 'SWE 381', 'Web Application Development', 3, 'level-3', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Sixth Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-swe333', 'SWE 333', 'Software Quality Assurance', 3, 'level-3', NOW(), NOW()),
('course-csc227', 'CSC 227', 'Operating Systems', 3, 'level-3', NOW(), NOW()),
('course-swe321', 'SWE 321', 'Software Design & Architecture', 3, 'level-3', NOW(), NOW()),
('course-swe434', 'SWE 434', 'Software Testing and Validation', 3, 'level-3', NOW(), NOW()),
('course-swe482', 'SWE 482', 'Human-Computer Interaction', 3, 'level-3', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Seventh Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-ic107', 'IC 107', 'Professional Ethics', 2, 'level-4', NOW(), NOW()),
('course-swe479', 'SWE 479', 'Practical Training', 3, 'level-4', NOW(), NOW()),
('course-swe477', 'SWE 477', 'Software Engineering Code of Ethics & Professional Practice', 2, 'level-4', NOW(), NOW()),
('course-swe496', 'SWE 496', 'Graduation Project I', 3, 'level-4', NOW(), NOW()),
('course-swe444', 'SWE 444', 'Software Construction Laboratory', 2, 'level-4', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Eighth Semester Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-ic108', 'IC 108', 'Current Issues', 2, 'level-4', NOW(), NOW()),
('course-swe466', 'SWE 466', 'Software Project Management', 3, 'level-4', NOW(), NOW()),
('course-swe497', 'SWE 497', 'Graduation Project II', 3, 'level-4', NOW(), NOW()),
('course-swe455', 'SWE 455', 'Software Maintenance and Evolution', 3, 'level-4', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Elective Courses
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES
('course-ic101', 'IC 101', 'Principles of Islamic Culture', 2, 'level-1', NOW(), NOW()),
('course-ic100', 'IC 100', 'Studies in the Prophet Biography', 2, 'level-1', NOW(), NOW()),
('course-qurn100', 'QURN 100', 'Quran Kareem', 2, 'level-1', NOW(), NOW()),
('course-math254', 'MATH 254', 'Numerical Methods', 3, 'level-2', NOW(), NOW()),
('course-swe484', 'SWE 484', 'Multimedia Computing', 3, 'level-3', NOW(), NOW()),
('course-swe486', 'SWE 486', 'Cloud Computing & Big Data', 3, 'level-3', NOW(), NOW()),
('course-swe488', 'SWE 488', 'Complex Systems Engineering', 3, 'level-3', NOW(), NOW()),
('course-swe483', 'SWE 483', 'Mobile Application Development', 3, 'level-3', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 6. SECTIONS (Course Sections)
-- ============================================

-- First Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-arab100-01', 'ARAB 100-01', 'course-arab100', 'faculty-1', 'room-101', NOW(), NOW()),
('section-ent101-01', 'ENT 101-01', 'course-ent101', 'faculty-2', 'room-102', NOW(), NOW()),
('section-ct101-01', 'CT 101-01', 'course-ct101', 'faculty-3', 'lab-101', NOW(), NOW()),
('section-math101-01', 'MATH 101-01', 'course-math101', 'faculty-4', 'room-201', NOW(), NOW()),
('section-engs100-01', 'ENGS 100-01', 'course-engs100', 'faculty-5', 'room-202', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Third Semester Sections (Core CS courses)
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-csc111-01', 'CSC 111-01', 'course-csc111', 'faculty-3', 'lab-101', NOW(), NOW()),
('section-csc111-02', 'CSC 111-02', 'course-csc111', 'faculty-3', 'lab-102', NOW(), NOW()),
('section-math106-01', 'MATH 106-01', 'course-math106', 'faculty-4', 'room-201', NOW(), NOW()),
('section-phys103-01', 'PHYS 103-01', 'course-phys103', 'faculty-5', 'room-301', NOW(), NOW()),
('section-math151-01', 'MATH 151-01', 'course-math151', 'faculty-4', 'room-202', NOW(), NOW()),
('section-math244-01', 'MATH 244-01', 'course-math244', 'faculty-4', 'room-302', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Second Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-ci101-01', 'CI 101-01', 'course-ci101', 'faculty-1', 'room-101', NOW(), NOW()),
('section-engs110-01', 'ENGS 110-01', 'course-engs110', 'faculty-5', 'room-102', NOW(), NOW()),
('section-stat101-01', 'STAT 101-01', 'course-stat101', 'faculty-4', 'room-201', NOW(), NOW()),
('section-chem101-01', 'CHEM 101-01', 'course-chem101', 'faculty-5', 'room-301', NOW(), NOW()),
('section-eph101-01', 'EPH 101-01', 'course-eph101', 'faculty-6', 'room-302', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Fourth Semester - Additional sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-phys104-01', 'PHYS 104-01', 'course-phys104', 'faculty-5', 'room-301', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Fourth Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-swe211-01', 'SWE 211-01', 'course-swe211', 'faculty-1', 'room-201', NOW(), NOW()),
('section-csc113-01', 'CSC 113-01', 'course-csc113', 'faculty-3', 'lab-101', NOW(), NOW()),
('section-csc113-02', 'CSC 113-02', 'course-csc113', 'faculty-3', 'lab-102', NOW(), NOW()),
('section-csc220-01', 'CSC 220-01', 'course-csc220', 'faculty-2', 'room-301', NOW(), NOW()),
('section-cenx303-01', 'CENX 303-01', 'course-cenx303', 'faculty-6', 'room-302', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Fifth Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-swe312-01', 'SWE 312-01', 'course-swe312', 'faculty-1', 'room-201', NOW(), NOW()),
('section-swe314-01', 'SWE 314-01', 'course-swe314', 'faculty-1', 'room-202', NOW(), NOW()),
('section-csc212-01', 'CSC 212-01', 'course-csc212', 'faculty-3', 'lab-101', NOW(), NOW()),
('section-csc212-02', 'CSC 212-02', 'course-csc212', 'faculty-3', 'lab-201', NOW(), NOW()),
('section-is230-01', 'IS 230-01', 'course-is230', 'faculty-2', 'room-301', NOW(), NOW()),
('section-swe381-01', 'SWE 381-01', 'course-swe381', 'faculty-1', 'lab-101', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sixth Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-swe333-01', 'SWE 333-01', 'course-swe333', 'faculty-1', 'room-201', NOW(), NOW()),
('section-csc227-01', 'CSC 227-01', 'course-csc227', 'faculty-2', 'room-302', NOW(), NOW()),
('section-swe321-01', 'SWE 321-01', 'course-swe321', 'faculty-1', 'room-202', NOW(), NOW()),
('section-swe434-01', 'SWE 434-01', 'course-swe434', 'faculty-1', 'room-301', NOW(), NOW()),
('section-swe482-01', 'SWE 482-01', 'course-swe482', 'faculty-6', 'room-201', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seventh & Eighth Semester Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-swe496-01', 'SWE 496-01', 'course-swe496', 'faculty-1', 'room-201', NOW(), NOW()),
('section-swe497-01', 'SWE 497-01', 'course-swe497', 'faculty-1', 'room-201', NOW(), NOW()),
('section-swe466-01', 'SWE 466-01', 'course-swe466', 'faculty-1', 'room-202', NOW(), NOW()),
('section-swe455-01', 'SWE 455-01', 'course-swe455', 'faculty-2', 'room-301', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Elective Sections
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES
('section-swe483-01', 'SWE 483-01', 'course-swe483', 'faculty-1', 'lab-101', NOW(), NOW()),
('section-swe486-01', 'SWE 486-01', 'course-swe486', 'faculty-2', 'room-301', NOW(), NOW()),
('section-swe484-01', 'SWE 484-01', 'course-swe484', 'faculty-6', 'lab-201', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. SECTION MEETINGS (When sections meet)
-- ============================================

-- ARAB 100-01: Sunday & Tuesday 8:00-9:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-arab100-01-1', 'section-arab100-01', 'Sunday', '08:00', '09:30', NOW(), NOW()),
('meeting-arab100-01-2', 'section-arab100-01', 'Tuesday', '08:00', '09:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ENT 101-01: Sunday & Wednesday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-ent101-01-1', 'section-ent101-01', 'Sunday', '09:30', '11:00', NOW(), NOW()),
('meeting-ent101-01-2', 'section-ent101-01', 'Wednesday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CT 101-01: Monday & Wednesday 8:00-9:30 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-ct101-01-1', 'section-ct101-01', 'Monday', '08:00', '09:30', NOW(), NOW()),
('meeting-ct101-01-2', 'section-ct101-01', 'Wednesday', '08:00', '09:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- MATH 101-01: Sunday & Tuesday 11:00-12:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-math101-01-1', 'section-math101-01', 'Sunday', '11:00', '12:30', NOW(), NOW()),
('meeting-math101-01-2', 'section-math101-01', 'Tuesday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ENGS 100-01: Monday & Thursday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-engs100-01-1', 'section-engs100-01', 'Monday', '09:30', '11:00', NOW(), NOW()),
('meeting-engs100-01-2', 'section-engs100-01', 'Thursday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 111-01: Sunday & Tuesday 8:00-10:00 (Lab - longer)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc111-01-1', 'section-csc111-01', 'Sunday', '08:00', '10:00', NOW(), NOW()),
('meeting-csc111-01-2', 'section-csc111-01', 'Tuesday', '08:00', '10:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 111-02: Monday & Wednesday 11:00-13:00 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc111-02-1', 'section-csc111-02', 'Monday', '11:00', '13:00', NOW(), NOW()),
('meeting-csc111-02-2', 'section-csc111-02', 'Wednesday', '11:00', '13:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- MATH 106-01: Sunday & Tuesday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-math106-01-1', 'section-math106-01', 'Sunday', '09:30', '11:00', NOW(), NOW()),
('meeting-math106-01-2', 'section-math106-01', 'Tuesday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 211-01: Monday & Wednesday 8:00-9:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe211-01-1', 'section-swe211-01', 'Monday', '08:00', '09:30', NOW(), NOW()),
('meeting-swe211-01-2', 'section-swe211-01', 'Wednesday', '08:00', '09:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 113-01: Sunday & Tuesday 11:00-13:00 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc113-01-1', 'section-csc113-01', 'Sunday', '11:00', '13:00', NOW(), NOW()),
('meeting-csc113-01-2', 'section-csc113-01', 'Tuesday', '11:00', '13:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 212-01: Monday & Wednesday 9:30-11:30 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc212-01-1', 'section-csc212-01', 'Monday', '09:30', '11:30', NOW(), NOW()),
('meeting-csc212-01-2', 'section-csc212-01', 'Wednesday', '09:30', '11:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 312-01: Sunday & Tuesday 12:30-14:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe312-01-1', 'section-swe312-01', 'Sunday', '12:30', '14:00', NOW(), NOW()),
('meeting-swe312-01-2', 'section-swe312-01', 'Tuesday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 381-01: Monday & Thursday 11:00-12:30 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe381-01-1', 'section-swe381-01', 'Monday', '11:00', '12:30', NOW(), NOW()),
('meeting-swe381-01-2', 'section-swe381-01', 'Thursday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 483-01: Tuesday & Thursday 9:30-11:00 (Lab - Mobile Dev)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe483-01-1', 'section-swe483-01', 'Tuesday', '09:30', '11:00', NOW(), NOW()),
('meeting-swe483-01-2', 'section-swe483-01', 'Thursday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Additional section meetings for remaining sections
-- MATH 106-01: Sunday & Tuesday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-math106-01-1', 'section-math106-01', 'Sunday', '09:30', '11:00', NOW(), NOW()),
('meeting-math106-01-2', 'section-math106-01', 'Tuesday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- PHYS 103-01: Monday & Wednesday 11:00-12:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-phys103-01-1', 'section-phys103-01', 'Monday', '11:00', '12:30', NOW(), NOW()),
('meeting-phys103-01-2', 'section-phys103-01', 'Wednesday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- MATH 151-01: Sunday & Tuesday 12:30-14:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-math151-01-1', 'section-math151-01', 'Sunday', '12:30', '14:00', NOW(), NOW()),
('meeting-math151-01-2', 'section-math151-01', 'Tuesday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- MATH 244-01: Monday & Wednesday 12:30-14:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-math244-01-1', 'section-math244-01', 'Monday', '12:30', '14:00', NOW(), NOW()),
('meeting-math244-01-2', 'section-math244-01', 'Wednesday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 113-02: Monday & Wednesday 14:00-16:00 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc113-02-1', 'section-csc113-02', 'Monday', '14:00', '16:00', NOW(), NOW()),
('meeting-csc113-02-2', 'section-csc113-02', 'Wednesday', '14:00', '16:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 220-01: Sunday & Tuesday 14:00-15:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc220-01-1', 'section-csc220-01', 'Sunday', '14:00', '15:30', NOW(), NOW()),
('meeting-csc220-01-2', 'section-csc220-01', 'Tuesday', '14:00', '15:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CENX 303-01: Monday & Thursday 8:00-9:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-cenx303-01-1', 'section-cenx303-01', 'Monday', '08:00', '09:30', NOW(), NOW()),
('meeting-cenx303-01-2', 'section-cenx303-01', 'Thursday', '08:00', '09:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 314-01: Sunday & Wednesday 11:00-12:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe314-01-1', 'section-swe314-01', 'Sunday', '11:00', '12:30', NOW(), NOW()),
('meeting-swe314-01-2', 'section-swe314-01', 'Wednesday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 212-02: Tuesday & Thursday 8:00-10:00 (Lab)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc212-02-1', 'section-csc212-02', 'Tuesday', '08:00', '10:00', NOW(), NOW()),
('meeting-csc212-02-2', 'section-csc212-02', 'Thursday', '08:00', '10:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- IS 230-01: Monday & Wednesday 14:00-15:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-is230-01-1', 'section-is230-01', 'Monday', '14:00', '15:30', NOW(), NOW()),
('meeting-is230-01-2', 'section-is230-01', 'Wednesday', '14:00', '15:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 333-01: Sunday & Tuesday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe333-01-1', 'section-swe333-01', 'Sunday', '09:30', '11:00', NOW(), NOW()),
('meeting-swe333-01-2', 'section-swe333-01', 'Tuesday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- CSC 227-01: Monday & Wednesday 9:30-11:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-csc227-01-1', 'section-csc227-01', 'Monday', '09:30', '11:00', NOW(), NOW()),
('meeting-csc227-01-2', 'section-csc227-01', 'Wednesday', '09:30', '11:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 321-01: Sunday & Tuesday 11:00-12:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe321-01-1', 'section-swe321-01', 'Sunday', '11:00', '12:30', NOW(), NOW()),
('meeting-swe321-01-2', 'section-swe321-01', 'Tuesday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 434-01: Monday & Thursday 12:30-14:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe434-01-1', 'section-swe434-01', 'Monday', '12:30', '14:00', NOW(), NOW()),
('meeting-swe434-01-2', 'section-swe434-01', 'Thursday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 482-01: Tuesday & Thursday 11:00-12:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe482-01-1', 'section-swe482-01', 'Tuesday', '11:00', '12:30', NOW(), NOW()),
('meeting-swe482-01-2', 'section-swe482-01', 'Thursday', '11:00', '12:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 496-01: Sunday & Tuesday 14:00-15:30 (Project)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe496-01-1', 'section-swe496-01', 'Sunday', '14:00', '15:30', NOW(), NOW()),
('meeting-swe496-01-2', 'section-swe496-01', 'Tuesday', '14:00', '15:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 497-01: Monday & Wednesday 14:00-15:30 (Project)
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe497-01-1', 'section-swe497-01', 'Monday', '14:00', '15:30', NOW(), NOW()),
('meeting-swe497-01-2', 'section-swe497-01', 'Wednesday', '14:00', '15:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 466-01: Sunday & Wednesday 8:00-9:30
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe466-01-1', 'section-swe466-01', 'Sunday', '08:00', '09:30', NOW(), NOW()),
('meeting-swe466-01-2', 'section-swe466-01', 'Wednesday', '08:00', '09:30', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- SWE 455-01: Tuesday & Thursday 12:30-14:00
INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES
('meeting-swe455-01-1', 'section-swe455-01', 'Tuesday', '12:30', '14:00', NOW(), NOW()),
('meeting-swe455-01-2', 'section-swe455-01', 'Thursday', '12:30', '14:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. ASSIGNMENTS (Students enrolled in sections)
-- ============================================

-- Student 1 enrolled in First Semester courses
INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES
('assign-stu1-arab100', 'student-1', 'section-arab100-01', 'course-arab100', NOW(), NOW()),
('assign-stu1-ent101', 'student-1', 'section-ent101-01', 'course-ent101', NOW(), NOW()),
('assign-stu1-ct101', 'student-1', 'section-ct101-01', 'course-ct101', NOW(), NOW()),
('assign-stu1-math101', 'student-1', 'section-math101-01', 'course-math101', NOW(), NOW()),
('assign-stu1-engs100', 'student-1', 'section-engs100-01', 'course-engs100', NOW(), NOW())
ON CONFLICT ("studentId", "sectionId") DO NOTHING;

-- Student 2 enrolled in Third Semester courses
INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES
('assign-stu2-csc111', 'student-2', 'section-csc111-01', 'course-csc111', NOW(), NOW()),
('assign-stu2-math106', 'student-2', 'section-math106-01', 'course-math106', NOW(), NOW()),
('assign-stu2-phys103', 'student-2', 'section-phys103-01', 'course-phys103', NOW(), NOW()),
('assign-stu2-math151', 'student-2', 'section-math151-01', 'course-math151', NOW(), NOW()),
('assign-stu2-math244', 'student-2', 'section-math244-01', 'course-math244', NOW(), NOW())
ON CONFLICT ("studentId", "sectionId") DO NOTHING;

-- Student 3 enrolled in Fourth Semester courses
INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES
('assign-stu3-swe211', 'student-3', 'section-swe211-01', 'course-swe211', NOW(), NOW()),
('assign-stu3-csc113', 'student-3', 'section-csc113-01', 'course-csc113', NOW(), NOW()),
('assign-stu3-csc220', 'student-3', 'section-csc220-01', 'course-csc220', NOW(), NOW()),
('assign-stu3-cenx303', 'student-3', 'section-cenx303-01', 'course-cenx303', NOW(), NOW())
ON CONFLICT ("studentId", "sectionId") DO NOTHING;

-- Student 4 enrolled in Fifth Semester courses
INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES
('assign-stu4-swe312', 'student-4', 'section-swe312-01', 'course-swe312', NOW(), NOW()),
('assign-stu4-swe314', 'student-4', 'section-swe314-01', 'course-swe314', NOW(), NOW()),
('assign-stu4-csc212', 'student-4', 'section-csc212-01', 'course-csc212', NOW(), NOW()),
('assign-stu4-is230', 'student-4', 'section-is230-01', 'course-is230', NOW(), NOW()),
('assign-stu4-swe381', 'student-4', 'section-swe381-01', 'course-swe381', NOW(), NOW())
ON CONFLICT ("studentId", "sectionId") DO NOTHING;

-- Student 5 enrolled in Sixth Semester + Elective
INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES
('assign-stu5-swe333', 'student-5', 'section-swe333-01', 'course-swe333', NOW(), NOW()),
('assign-stu5-csc227', 'student-5', 'section-csc227-01', 'course-csc227', NOW(), NOW()),
('assign-stu5-swe321', 'student-5', 'section-swe321-01', 'course-swe321', NOW(), NOW()),
('assign-stu5-swe434', 'student-5', 'section-swe434-01', 'course-swe434', NOW(), NOW()),
('assign-stu5-swe483', 'student-5', 'section-swe483-01', 'course-swe483', NOW(), NOW())
ON CONFLICT ("studentId", "sectionId") DO NOTHING;

-- ============================================
-- 9. SCHEDULE STATUSES
-- ============================================
INSERT INTO schedule_statuses (name, description, "createdAt", "updatedAt") VALUES
('DRAFT', 'Schedule is in draft mode and can be modified', NOW(), NOW()),
('PUBLISHED', 'Schedule has been published and is active', NOW(), NOW()),
('ARCHIVED', 'Schedule has been archived', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count records
-- SELECT 'Levels' as table_name, COUNT(*) as count FROM levels
-- UNION ALL SELECT 'Users', COUNT(*) FROM users
-- UNION ALL SELECT 'Rooms', COUNT(*) FROM rooms
-- UNION ALL SELECT 'Time Slots', COUNT(*) FROM time_slots
-- UNION ALL SELECT 'Courses', COUNT(*) FROM courses
-- UNION ALL SELECT 'Sections', COUNT(*) FROM sections
-- UNION ALL SELECT 'Section Meetings', COUNT(*) FROM section_meetings
-- UNION ALL SELECT 'Assignments', COUNT(*) FROM assignments;

