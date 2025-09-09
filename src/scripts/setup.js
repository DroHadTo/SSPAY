#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initializeDatabase } = require('../models');

async function setup() {
    console.log('🚀 Setting up SSPAY...\n');

    try {
        // Check environment file
        const envPath = path.join(__dirname, '../../.env');
        if (!fs.existsSync(envPath)) {
            console.log('⚠️ Creating .env file from template...');
            const envExample = path.join(__dirname, '../../.env.example');
            if (fs.existsSync(envExample)) {
                fs.copyFileSync(envExample, envPath);
                console.log('✅ .env file created');
            } else {
                console.log('⚠️ No .env.example found, creating basic .env...');
                const basicEnv = `# SSPAY Configuration
NODE_ENV=development
PORT=3000

# Printify API
PRINTIFY_API_KEY=your_printify_api_key_here
PRINTIFY_SHOP_ID=your_shop_id_here

# Solana Configuration
SOLANA_NETWORK=mainnet-beta
MERCHANT_WALLET=89znXatBP5yXeA3JowynCwXTYqGSB833A9p96kfLcGkZ
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:8080
`;
                fs.writeFileSync(envPath, basicEnv);
                console.log('✅ Basic .env file created');
            }
        }

        // Initialize database
        console.log('📦 Initializing database...');
        const dbInitialized = await initializeDatabase();
        
        if (!dbInitialized) {
            console.error('❌ Database initialization failed');
            process.exit(1);
        }

        // Create data directory
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✅ Data directory created');
        }

        // Create public directory structure
        const publicDir = path.join(__dirname, '../../public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
            console.log('✅ Public directory created');
        }

        const adminDir = path.join(publicDir, 'admin');
        if (!fs.existsSync(adminDir)) {
            fs.mkdirSync(adminDir, { recursive: true });
            
            // Create a basic admin index.html
            const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSPAY Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .card { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .api-link { color: #007bff; text-decoration: none; }
        .api-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SSPAY Admin Dashboard</h1>
        <p>Cryptocurrency E-commerce Platform</p>
    </div>
    
    <div class="card">
        <h3>API Endpoints</h3>
        <ul>
            <li><a href="/api/admin/dashboard" class="api-link">Dashboard Stats</a></li>
            <li><a href="/api/products" class="api-link">Products</a></li>
            <li><a href="/api/orders" class="api-link">Orders</a></li>
            <li><a href="/api/payments" class="api-link">Payments</a></li>
            <li><a href="/health" class="api-link">Health Check</a></li>
        </ul>
    </div>
    
    <div class="card">
        <h3>Quick Actions</h3>
        <button onclick="syncProducts()">Sync Printify Products</button>
        <button onclick="viewDashboard()">View Dashboard</button>
    </div>
    
    <script>
        async function syncProducts() {
            try {
                const response = await fetch('/api/admin/sync-printify', { method: 'POST' });
                const result = await response.json();
                alert(result.message);
            } catch (error) {
                alert('Error syncing products: ' + error.message);
            }
        }
        
        async function viewDashboard() {
            try {
                const response = await fetch('/api/admin/dashboard');
                const result = await response.json();
                console.log('Dashboard data:', result.data);
                alert('Dashboard data logged to console');
            } catch (error) {
                alert('Error fetching dashboard: ' + error.message);
            }
        }
    </script>
</body>
</html>`;
            fs.writeFileSync(path.join(adminDir, 'index.html'), adminHtml);
            console.log('✅ Admin interface created');
        }

        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update your .env file with your Printify API credentials');
        console.log('2. Run: npm start');
        console.log('3. Visit: http://localhost:3000');
        console.log('\nFor more information, see README.md');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setup();
}

module.exports = setup;
