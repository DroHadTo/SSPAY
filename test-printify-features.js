#!/usr/bin/env node

const printifyService = require('./src/services/printifyService');

async function testPrintifyFeatures() {
    console.log('🔧 Testing Enhanced PrintifyService Features\n');

    try {
        // Test 1: Connection Test
        console.log('1️⃣ Testing API Connection...');
        const connectionResult = await printifyService.testConnection();
        console.log('   Result:', connectionResult.success ? '✅ Connected' : '❌ Failed');
        console.log('   Message:', connectionResult.message);

        if (!connectionResult.success) {
            console.log('\n❌ Cannot proceed without API connection');
            return;
        }

        // Test 2: Shop Information
        console.log('\n2️⃣ Getting Shop Information...');
        try {
            const shopInfo = await printifyService.getShopInfo();
            console.log('   Shop ID:', shopInfo.id || 'Not available');
            console.log('   Shop Title:', shopInfo.title || 'Not available');
        } catch (error) {
            console.log('   ❌ Shop info error:', error.message);
        }

        // Test 3: Product Fetching with Enhanced Features
        console.log('\n3️⃣ Testing Enhanced Product Fetching...');
        try {
            const productsResult = await printifyService.getProducts(1, 5);
            console.log('   Products found:', productsResult.products?.length || 0);
            console.log('   Pagination info:', productsResult.pagination);

            if (productsResult.products && productsResult.products.length > 0) {
                const firstProduct = productsResult.products[0];
                console.log('\n4️⃣ Testing Product Transformation...');
                const transformedProduct = printifyService.transformProduct(firstProduct);
                console.log('   Original title:', firstProduct.title);
                console.log('   Transformed category:', transformedProduct.category);
                console.log('   Base price:', transformedProduct.base_price);
                console.log('   Status:', transformedProduct.status);
                console.log('   Images count:', transformedProduct.images?.length || 0);
                console.log('   Variants count:', transformedProduct.variants?.length || 0);
            }
        } catch (error) {
            console.log('   ❌ Products error:', error.message);
        }

        // Test 4: Category Detection
        console.log('\n5️⃣ Testing Category Detection...');
        const testProducts = [
            { title: 'Cool T-Shirt Design', description: 'Awesome shirt for everyone' },
            { title: 'Coffee Mug', description: 'Perfect mug for morning coffee' },
            { title: 'iPhone Case', description: 'Protective phone case' },
            { title: 'Wall Poster', description: 'Beautiful art print for your wall' },
            { title: 'Vinyl Sticker', description: 'Waterproof decal' }
        ];

        testProducts.forEach(product => {
            const category = printifyService.determineCategory(product);
            console.log(`   "${product.title}" → ${category}`);
        });

        console.log('\n✅ PrintifyService feature test completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testPrintifyFeatures().catch(console.error);
}

module.exports = testPrintifyFeatures;
