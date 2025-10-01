const fs = require('fs');
const path = require('path');

// Check for hardcoded instructor IDs/names in the codebase
function checkHardcodedIds() {
  console.log('🔍 Checking for hardcoded instructor IDs/names...\n');
  
  const hardcodedPatterns = [
    // Common hardcoded patterns
    /instructorId\s*:\s*['"][^'"]+['"]/gi,
    /instructorId\s*:\s*[a-zA-Z0-9_-]+/gi,
    /instructorId\s*=\s*['"][^'"]+['"]/gi,
    /instructorId\s*=\s*[a-zA-Z0-9_-]+/gi,
    /'cmg[a-z0-9]+'/gi, // Prisma IDs
    /"cmg[a-z0-9]+"/gi, // Prisma IDs
    /Dr\.\s*Smith/gi,
    /faculty@university\.edu/gi,
    /smith/gi
  ];
  
  const excludePatterns = [
    /node_modules/,
    /\.git/,
    /\.next/,
    /dist/,
    /build/,
    /coverage/,
    /tests/,
    /scripts/
  ];
  
  let violations = [];
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      // Skip excluded directories
      if (stat.isDirectory() && excludePatterns.some(pattern => pattern.test(fullPath))) {
        continue;
      }
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.jsx')) {
        checkFile(fullPath);
      }
    }
  }
  
  function checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        hardcodedPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            // Check if it's a legitimate use (like in tests or comments)
            if (!isLegitimateUse(line, filePath)) {
              violations.push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
                pattern: pattern.toString()
              });
            }
          }
        });
      });
    } catch (error) {
      console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
    }
  }
  
  function isLegitimateUse(line, filePath) {
    // Allow in test files
    if (filePath.includes('test') || filePath.includes('spec')) {
      return true;
    }
    
    // Allow in comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      return true;
    }
    
    // Allow in documentation
    if (line.includes('TODO') || line.includes('FIXME') || line.includes('NOTE')) {
      return true;
    }
    
    // Allow in mock data
    if (line.includes('mock') || line.includes('Mock')) {
      return true;
    }
    
    return false;
  }
  
  // Start scanning from the smart-schedule directory
  const startDir = path.join(__dirname, '..');
  scanDirectory(startDir);
  
  // Report results
  console.log(`📊 Scan Results:`);
  console.log(`   Files scanned: ${new Set(violations.map(v => v.file)).size}`);
  console.log(`   Violations found: ${violations.length}`);
  
  if (violations.length > 0) {
    console.log('\n❌ Hardcoded ID violations found:');
    violations.forEach(violation => {
      console.log(`   ${violation.file}:${violation.line}`);
      console.log(`     ${violation.content}`);
      console.log('');
    });
    
    console.log('💡 Recommendations:');
    console.log('   - Use environment variables for configuration');
    console.log('   - Use database lookups instead of hardcoded IDs');
    console.log('   - Use constants or configuration files for static values');
    
    return false;
  } else {
    console.log('\n✅ No hardcoded instructor IDs found!');
    return true;
  }
}

// Run check if called directly
if (require.main === module) {
  const success = checkHardcodedIds();
  process.exit(success ? 0 : 1);
}

module.exports = { checkHardcodedIds };
