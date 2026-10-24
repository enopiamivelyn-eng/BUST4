/**
 * Setup Verification Script
 * Run this to check if everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Bus Ticketing System Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Prisma reads .env for CLI commands, while Next.js reads .env.local.
// Check both without ever printing the connection string (it contains a secret).
function hasConfiguredDatabaseUrl(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) return false;

  const contents = fs.readFileSync(filePath, 'utf8');
  const match = contents.match(/^\s*DATABASE_URL\s*=\s*['"]?([^\r\n'"]*)/m);
  const value = match?.[1]?.trim();
  return Boolean(value && !/YOUR_|placeholder|example/i.test(value));
}

const databaseUrlInEnv = hasConfiguredDatabaseUrl('.env');
const databaseUrlInEnvLocal = hasConfiguredDatabaseUrl('.env.local');
if (databaseUrlInEnv && databaseUrlInEnvLocal) {
  success.push('Database connection is configured in .env and .env.local');
} else {
  const missingFiles = [
    !databaseUrlInEnv && '.env (Prisma CLI)',
    !databaseUrlInEnvLocal && '.env.local (Next.js app)',
  ].filter(Boolean);
  errors.push(`DATABASE_URL is missing or still a placeholder in ${missingFiles.join(' and ')}`);
}

// Check 1: Database file exists
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
if (fs.existsSync(dbPath)) {
  success.push('✅ Database file exists');
} else {
  errors.push('❌ Database file not found. Run: npm run db:setup');
}

// Check 2: Prisma schema exists
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  success.push('✅ Prisma schema found');
} else {
  errors.push('❌ Prisma schema not found');
}

// Check 3: Seed file exists
const seedPath = path.join(__dirname, 'prisma', 'seed.ts');
if (fs.existsSync(seedPath)) {
  success.push('✅ Seed file found');
} else {
  warnings.push('⚠️  Seed file not found');
}

// Check 4: API routes exist
const apiPath = path.join(__dirname, 'app', 'api');
if (fs.existsSync(apiPath)) {
  const authPath = path.join(apiPath, 'auth');
  const bookingsPath = path.join(apiPath, 'bookings');
  const adminPath = path.join(apiPath, 'admin');
  
  if (fs.existsSync(authPath)) success.push('✅ Auth API routes found');
  else errors.push('❌ Auth API routes missing');
  
  if (fs.existsSync(bookingsPath)) success.push('✅ Bookings API routes found');
  else errors.push('❌ Bookings API routes missing');
  
  if (fs.existsSync(adminPath)) success.push('✅ Admin API routes found');
  else errors.push('❌ Admin API routes missing');
} else {
  errors.push('❌ API directory not found');
}

// Check 5: Auth utilities exist
const authLibPath = path.join(__dirname, 'lib', 'auth');
if (fs.existsSync(authLibPath)) {
  success.push('✅ Auth utilities found');
} else {
  errors.push('❌ Auth utilities missing');
}

// Check 6: Package.json scripts
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (pkg.scripts['db:setup']) success.push('✅ Database setup script found');
  else warnings.push('⚠️  db:setup script not found in package.json');
  
  if (pkg.dependencies['@prisma/client']) success.push('✅ Prisma client dependency found');
  else errors.push('❌ Prisma client not installed. Run: npm install');
} else {
  errors.push('❌ package.json not found');
}

// Check 7: Node modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  success.push('✅ Node modules installed');
} else {
  errors.push('❌ Node modules not found. Run: npm install');
}

// Print results
console.log('📋 Verification Results:\n');

if (success.length > 0) {
  console.log('SUCCESS:');
  success.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('WARNINGS:');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(msg => console.log('  ' + msg));
  console.log('');
  console.log('🔧 SETUP NEEDED:\n');
  console.log('  1. Run: npm install');
  console.log('  2. Run: npm run db:setup');
  console.log('  3. Run: npm run dev');
  console.log('');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  Setup is mostly complete but has warnings\n');
  process.exit(0);
} else {
  console.log('🎉 SETUP COMPLETE!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000');
  console.log('  3. Login with: admin@busticket.com / admin123');
  console.log('');
  process.exit(0);
}
