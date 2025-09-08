/**
 * Database Structure Inspector
 * Check the current database structure to understand what needs to be migrated
 */

const { sequelize } = require('./database/config');

async function inspectDatabase() {
    try {
        console.log('🔍 Inspecting database structure...');
        
        // Check tables
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('\n📋 Existing tables:', tables);
        
        // Check payments table structure
        if (tables.includes('payments')) {
            console.log('\n💳 Payments table structure:');
            const paymentsStructure = await sequelize.getQueryInterface().describeTable('payments');
            Object.keys(paymentsStructure).forEach(column => {
                console.log(`  - ${column}: ${paymentsStructure[column].type}`);
            });
        }
        
        // Check orders table structure
        if (tables.includes('orders')) {
            console.log('\n📦 Orders table structure:');
            const ordersStructure = await sequelize.getQueryInterface().describeTable('orders');
            Object.keys(ordersStructure).forEach(column => {
                console.log(`  - ${column}: ${ordersStructure[column].type}`);
            });
        }
        
        // Check products table structure
        if (tables.includes('products')) {
            console.log('\n🛍️  Products table structure:');
            const productsStructure = await sequelize.getQueryInterface().describeTable('products');
            Object.keys(productsStructure).forEach(column => {
                console.log(`  - ${column}: ${productsStructure[column].type}`);
            });
        }
        
        console.log('\n✅ Database inspection complete');
        
    } catch (error) {
        console.error('❌ Database inspection failed:', error);
    } finally {
        await sequelize.close();
    }
}

inspectDatabase();
