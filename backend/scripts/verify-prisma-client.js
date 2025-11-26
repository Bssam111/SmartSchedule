#!/usr/bin/env node

/**
 * Prisma Client Verification Script
 * 
 * This script verifies that Prisma Client has been generated correctly.
 * It can be used to test the Docker build process.
 * 
 * Usage:
 *   node scripts/verify-prisma-client.js
 */

const fs = require('fs');
const path = require('path');

const PRISMA_CLIENT_PATH = path.join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client',
  'index.js'
);

const PRISMA_CLIENT_DTS_PATH = path.join(
  process.cwd(),
  'node_modules',
  '.prisma',
  'client',
  'index.d.ts'
);

function verifyPrismaClient() {
  console.log('🔍 Verifying Prisma Client generation...\n');
  
  // Check if Prisma Client files exist
  const clientExists = fs.existsSync(PRISMA_CLIENT_PATH);
  const clientDtsExists = fs.existsSync(PRISMA_CLIENT_DTS_PATH);
  
  if (!clientExists) {
    console.error('❌ ERROR: Prisma Client not found at:', PRISMA_CLIENT_PATH);
    console.error('   Please run: npx prisma generate');
    process.exit(1);
  }
  
  if (!clientDtsExists) {
    console.error('❌ ERROR: Prisma Client type definitions not found at:', PRISMA_CLIENT_DTS_PATH);
    console.error('   Please run: npx prisma generate');
    process.exit(1);
  }
  
  console.log('✅ Prisma Client files found:');
  console.log('   -', PRISMA_CLIENT_PATH);
  console.log('   -', PRISMA_CLIENT_DTS_PATH);
  
  // Try to import Prisma Client
  try {
    const { PrismaClient } = require('@prisma/client');
    console.log('\n✅ Prisma Client imported successfully');
    
    // Try to instantiate it (without connecting)
    const prisma = new PrismaClient();
    console.log('✅ Prisma Client instantiated successfully');
    
    console.log('\n🎉 All Prisma Client checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR: Failed to import or instantiate Prisma Client:');
    console.error('   ', error.message);
    process.exit(1);
  }
}

// Run verification
verifyPrismaClient();

