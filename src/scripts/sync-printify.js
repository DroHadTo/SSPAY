#!/usr/bin/env node

require('dotenv').config();
const { Product } = require('../models');
const printifyService = require('../services/printifyService');

async function syncPrintifyProducts() {
    console.log('🔄 Starting Printify product sync...\n');

    try {
        // Check Printify configuration
        if (!process.env.PRINTIFY_API_KEY) {
            console.error('❌ PRINTIFY_API_KEY not configured in .env file');
            process.exit(1);
        }

        // Fetch products from Printify
        console.log('📡 Fetching products from Printify...');
        const printifyProducts = await printifyService.getProducts();

        if (!printifyProducts || !printifyProducts.data) {
            console.error('❌ No products found in Printify');
            return;
        }

        console.log(`📦 Found ${printifyProducts.data.length} products in Printify\n`);

        const results = {
            created: 0,
            updated: 0,
            errors: []
        };

        // Process each product
        for (let i = 0; i < printifyProducts.data.length; i++) {
            const printifyProduct = printifyProducts.data[i];
            
            try {
                console.log(`Processing ${i + 1}/${printifyProducts.data.length}: ${printifyProduct.title}`);
                
                // Transform Printify data to our format
                const productData = printifyService.transformProductData(printifyProduct);
                
                // Find or create product in database
                const [product, created] = await Product.findOrCreate({
                    where: { printify_product_id: printifyProduct.id },
                    defaults: productData
                });

                if (!created) {
                    // Update existing product
                    await product.update(productData);
                    results.updated++;
                    console.log(`  ✅ Updated`);
                } else {
                    // New product created
                    results.created++;
                    console.log(`  🆕 Created`);
                }

            } catch (error) {
                console.error(`  ❌ Error: ${error.message}`);
                results.errors.push({
                    product_id: printifyProduct.id,
                    title: printifyProduct.title,
                    error: error.message
                });
            }
        }

        // Print summary
        console.log('\n📊 Sync Summary:');
        console.log(`✅ Created: ${results.created} products`);
        console.log(`🔄 Updated: ${results.updated} products`);
        console.log(`❌ Errors: ${results.errors.length} products`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(error => {
                console.log(`  - ${error.title}: ${error.error}`);
            });
        }

        console.log('\n🎉 Sync completed!');

        // Print some stats
        const totalProducts = await Product.count();
        const activeProducts = await Product.count({ where: { status: 'active' } });
        
        console.log(`\n📈 Database Stats:`);
        console.log(`Total products: ${totalProducts}`);
        console.log(`Active products: ${activeProducts}`);

    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        if (error.message.includes('401')) {
            console.error('\n💡 Tip: Check your PRINTIFY_API_KEY in .env file');
        }
        
        process.exit(1);
    }
}

// Seed some sample products if Printify is not configured
async function seedSampleProducts() {
    console.log('🌱 Seeding sample products...\n');

    const sampleProducts = [
        {
            title: 'Crypto Enthusiast T-Shirt',
            description: 'Show your love for cryptocurrency with this premium t-shirt',
            base_price: 25.99,
            crypto_price_sol: 0.15,
            crypto_price_usdc: 25.99,
            category: 'apparel',
            status: 'active',
            is_featured: true,
            images: [
                { src: 'https://via.placeholder.com/400x400?text=Crypto+T-Shirt' }
            ],
            tags: ['crypto', 'bitcoin', 'blockchain', 't-shirt']
        },
        {
            title: 'Solana Pay Hoodie',
            description: 'Premium hoodie featuring Solana Pay branding',
            base_price: 45.99,
            crypto_price_sol: 0.28,
            crypto_price_usdc: 45.99,
            category: 'apparel',
            status: 'active',
            is_featured: true,
            images: [
                { src: 'https://via.placeholder.com/400x400?text=Solana+Hoodie' }
            ],
            tags: ['solana', 'hoodie', 'crypto']
        },
        {
            title: 'Blockchain Coffee Mug',
            description: 'Start your day with this blockchain-themed coffee mug',
            base_price: 15.99,
            crypto_price_sol: 0.10,
            crypto_price_usdc: 15.99,
            category: 'accessories',
            status: 'active',
            is_featured: false,
            images: [
                { src: 'https://via.placeholder.com/400x400?text=Coffee+Mug' }
            ],
            tags: ['blockchain', 'coffee', 'mug']
        }
    ];

    let created = 0;
    for (const productData of sampleProducts) {
        try {
            const [product, wasCreated] = await Product.findOrCreate({
                where: { title: productData.title },
                defaults: productData
            });

            if (wasCreated) {
                created++;
                console.log(`✅ Created: ${productData.title}`);
            } else {
                console.log(`⏭️ Exists: ${productData.title}`);
            }
        } catch (error) {
            console.error(`❌ Error creating ${productData.title}:`, error.message);
        }
    }

    console.log(`\n🎉 Seeding completed! Created ${created} new products.`);
}

async function main() {
    if (process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_API_KEY !== 'your_printify_api_key_here') {
        await syncPrintifyProducts();
    } else {
        console.log('⚠️ Printify not configured, seeding sample products instead...\n');
        await seedSampleProducts();
    }
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = { syncPrintifyProducts, seedSampleProducts };
