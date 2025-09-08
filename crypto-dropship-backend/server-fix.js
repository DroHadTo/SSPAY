// Quick Server Test and Fix
// This will identify and fix common server startup issues

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING SERVER ISSUES...\n');

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found in crypto-dropship-backend');
    process.exit(1);
}

console.log('✅ package.json found');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found. Please run: npm install');
    process.exit(1);
}

console.log('✅ node_modules found');

// Check critical files
const criticalFiles = [
    'server.js',
    'database/models/index.js',
    'routes/products-v2.js',
    'routes/crypto-payments.js'
];

let missingFiles = [];
criticalFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log('❌ Missing critical files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    process.exit(1);
}

console.log('✅ All critical files present');

// Try to start database
try {
    const { initializeDatabase } = require('./database/models');
    console.log('✅ Database models loaded successfully');
} catch (error) {
    console.log('❌ Database initialization error:', error.message);
    process.exit(1);
}

// Check environment
console.log('\n📋 Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- PORT:', process.env.PORT || '3000');
console.log('- PRINTIFY_API_TOKEN:', process.env.PRINTIFY_API_TOKEN ? 'SET' : 'NOT SET');

console.log('\n🎉 Server diagnostics completed successfully!');
console.log('🚀 Starting server...\n');

// Start the actual server
require('./server.js');
