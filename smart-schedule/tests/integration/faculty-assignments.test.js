const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Integration tests for faculty assignments
async function runFacultyAssignmentsTests() {
  console.log('🧪 Running faculty assignments integration tests...\n');
  
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function addTest(name, passed, message) {
    testResults.tests.push({ name, passed, message });
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }
  
  try {
    // Test 1: Create faculty A and faculty B
    console.log('1. Creating test faculty members...');
    
    const facultyA = await prisma.user.create({
      data: {
        email: 'faculty-a@test.com',
        name: 'Faculty A',
        role: 'FACULTY'
      }
    });
    
    const facultyB = await prisma.user.create({
      data: {
        email: 'faculty-b@test.com',
        name: 'Faculty B',
        role: 'FACULTY'
      }
    });
    
    addTest('Create Faculty A', !!facultyA.id, `Created with ID: ${facultyA.id}`);
    addTest('Create Faculty B', !!facultyB.id, `Created with ID: ${facultyB.id}`);
    
    // Test 2: Create course
    console.log('\n2. Creating test course...');
    
    const course = await prisma.course.create({
      data: {
        code: 'TEST101',
        name: 'Test Course',
        credits: 3,
        levelId: (await prisma.level.findFirst()).id
      }
    });
    
    addTest('Create Course', !!course.id, `Created with ID: ${course.id}`);
    
    // Test 3: Create 3 sections for faculty A, 1 for faculty B
    console.log('\n3. Creating test sections...');
    
    const sectionsA = await Promise.all([
      prisma.section.create({
        data: {
          name: 'Section-A1',
          courseId: course.id,
          instructorId: facultyA.id,
          roomId: (await prisma.room.findFirst()).id
        }
      }),
      prisma.section.create({
        data: {
          name: 'Section-A2',
          courseId: course.id,
          instructorId: facultyA.id,
          roomId: (await prisma.room.findFirst()).id
        }
      }),
      prisma.section.create({
        data: {
          name: 'Section-A3',
          courseId: course.id,
          instructorId: facultyA.id,
          roomId: (await prisma.room.findFirst()).id
        }
      })
    ]);
    
    const sectionB = await prisma.section.create({
      data: {
        name: 'Section-B1',
        courseId: course.id,
        instructorId: facultyB.id,
        roomId: (await prisma.room.findFirst()).id
      }
    });
    
    addTest('Create 3 sections for Faculty A', sectionsA.length === 3, `Created ${sectionsA.length} sections`);
    addTest('Create 1 section for Faculty B', !!sectionB.id, `Created section: ${sectionB.id}`);
    
    // Test 4: Test faculty assignments API for Faculty A (should return 3)
    console.log('\n4. Testing faculty assignments API...');
    
    const facultyAAssignments = await prisma.section.findMany({
      where: { instructorId: facultyA.id },
      include: {
        course: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: true
          }
        }
      }
    });
    
    addTest('Faculty A has 3 sections', facultyAAssignments.length === 3, `Found ${facultyAAssignments.length} sections`);
    
    // Test 5: Test faculty assignments API for Faculty B (should return 1)
    const facultyBAssignments = await prisma.section.findMany({
      where: { instructorId: facultyB.id },
      include: {
        course: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: true
          }
        }
      }
    });
    
    addTest('Faculty B has 1 section', facultyBAssignments.length === 1, `Found ${facultyBAssignments.length} sections`);
    
    // Test 6: Update one section from A to B
    console.log('\n5. Testing section reassignment...');
    
    const updatedSection = await prisma.section.update({
      where: { id: sectionsA[0].id },
      data: { instructorId: facultyB.id }
    });
    
    addTest('Update section instructor', updatedSection.instructorId === facultyB.id, 'Section reassigned to Faculty B');
    
    // Test 7: Verify new counts (A should have 2, B should have 2)
    const facultyAAssignmentsAfter = await prisma.section.findMany({
      where: { instructorId: facultyA.id }
    });
    
    const facultyBAssignmentsAfter = await prisma.section.findMany({
      where: { instructorId: facultyB.id }
    });
    
    addTest('Faculty A now has 2 sections', facultyAAssignmentsAfter.length === 2, `Found ${facultyAAssignmentsAfter.length} sections`);
    addTest('Faculty B now has 2 sections', facultyBAssignmentsAfter.length === 2, `Found ${facultyBAssignmentsAfter.length} sections`);
    
    // Test 8: Test creating section without instructor (should fail)
    console.log('\n6. Testing section creation validation...');
    
    try {
      await prisma.section.create({
        data: {
          name: 'Section-NoInstructor',
          courseId: course.id,
          instructorId: null, // This should fail due to schema constraints
          roomId: (await prisma.room.findFirst()).id
        }
      });
      addTest('Section creation without instructor', false, 'Should have failed but succeeded');
    } catch (error) {
      addTest('Section creation without instructor', true, 'Correctly failed: ' + error.message);
    }
    
    // Cleanup
    console.log('\n7. Cleaning up test data...');
    
    await prisma.section.deleteMany({
      where: {
        instructorId: { in: [facultyA.id, facultyB.id] }
      }
    });
    
    await prisma.course.delete({
      where: { id: course.id }
    });
    
    await prisma.user.deleteMany({
      where: {
        id: { in: [facultyA.id, facultyB.id] }
      }
    });
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    addTest('Test Suite', false, 'Failed with error: ' + error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.message}`);
    });
  }
  
  return testResults;
}

// Run tests if called directly
if (require.main === module) {
  runFacultyAssignmentsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runFacultyAssignmentsTests };
