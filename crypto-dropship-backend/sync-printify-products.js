// Sync real Printify products to local database
require('dotenv').config();
const axios = require('axios');
const { Product } = require('./database/models');

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;

console.log('🔄 Syncing real Printify products to crypto store...');

async function syncPrintifyProducts() {
    try {
        // Step 1: Get user shops
        console.log('\n1️⃣ Fetching your Printify shops...');
        const shopsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });

        if (shopsResponse.data.length === 0) {
            console.log('❌ No shops found. Please create a shop in your Printify account first.');
            return;
        }

        console.log(`✅ Found ${shopsResponse.data.length} shop(s)`);
        const shop = shopsResponse.data[0]; // Use first shop
        console.log(`📍 Using shop: ${shop.title} (ID: ${shop.id})`);

        // Step 2: Get products from the shop
        console.log('\n2️⃣ Fetching products from your shop...');
        const productsResponse = await axios.get(`${PRINTIFY_API_BASE}/shops/${shop.id}/products.json`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Crypto Dropship Store'
            }
        });

        const printifyProducts = productsResponse.data.data;
        console.log(`✅ Found ${printifyProducts.length} products in your Printify shop`);

        if (printifyProducts.length === 0) {
            console.log('💡 No products found. Creating sample products from catalog...');
            await createSampleProducts(shop.id);
            return;
        }

        // Step 3: Clear existing products (optional)
        console.log('\n3️⃣ Clearing existing demo products...');
        await Product.destroy({ where: {} });
        console.log('✅ Cleared existing products');

        // Step 4: Sync Printify products to local database
        console.log('\n4️⃣ Syncing Printify products to local database...');
        let syncedCount = 0;

        for (const printifyProduct of printifyProducts) {
            try {
                // Calculate pricing with markup
                const basePrice = printifyProduct.variants?.[0]?.price || 2000; // Default $20.00 if no price
                const basePriceUSD = basePrice / 100; // Convert from cents to dollars
                const markupPercentage = 50; // 50% markup
                const sellingPrice = basePriceUSD * (1 + markupPercentage / 100);

                // Extract images
                const images = [];
                if (printifyProduct.images && printifyProduct.images.length > 0) {
                    images.push(printifyProduct.images[0].src);
                }

                // Create product in local database
                const productData = {
                    printify_product_id: printifyProduct.id.toString(),
                    printify_blueprint_id: printifyProduct.blueprint_id,
                    printify_print_provider_id: printifyProduct.print_provider_id,
                    title: printifyProduct.title,
                    description: printifyProduct.description || `Premium ${printifyProduct.title} from Printify`,
                    tags: JSON.stringify(printifyProduct.tags || ['printify', 'custom']),
                    images: JSON.stringify(images),
                    variants: JSON.stringify(printifyProduct.variants || []),
                    base_price: basePriceUSD,
                    markup_percentage: markupPercentage,
                    selling_price: Math.round(sellingPrice * 100) / 100, // Round to 2 decimal places
                    category: detectCategory(printifyProduct.title, printifyProduct.blueprint_id),
                    is_available: printifyProduct.visible && !printifyProduct.is_locked,
                    is_published: printifyProduct.visible,
                    inventory_count: 999 // Printify handles inventory
                };

                await Product.create(productData);
                syncedCount++;

                console.log(`✅ Synced: ${printifyProduct.title} - $${productData.selling_price}`);

            } catch (productError) {
                console.error(`❌ Error syncing product ${printifyProduct.title}:`, productError.message);
            }
        }

        console.log(`\n🎉 Sync completed! ${syncedCount}/${printifyProducts.length} products synced successfully`);

        // Step 5: Display summary
        const allProducts = await Product.findAll();
        console.log('\n📊 Product Summary:');
        allProducts.forEach(product => {
            console.log(`  📦 ${product.title}`);
            console.log(`     💰 Price: $${product.selling_price}`);
            console.log(`     🏷️  Category: ${product.category}`);
            console.log(`     ✅ Published: ${product.is_published}`);
            console.log('');
        });

        console.log('🚀 Your real Printify products are now available with crypto payments!');
        console.log('🌐 Visit: http://localhost:3000/crypto-shop');

    } catch (error) {
        console.error('❌ Sync Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            errors: error.response?.data?.errors
        });
    }
}

// Helper function to detect product category
function detectCategory(title, blueprintId) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('tank')) {
        return 'Apparel';
    } else if (titleLower.includes('mug') || titleLower.includes('cup') || titleLower.includes('bottle')) {
        return 'Drinkware';
    } else if (titleLower.includes('bag') || titleLower.includes('tote') || titleLower.includes('backpack')) {
        return 'Bags';
    } else if (titleLower.includes('phone') || titleLower.includes('case') || titleLower.includes('cover')) {
        return 'Accessories';
    } else if (titleLower.includes('poster') || titleLower.includes('print') || titleLower.includes('canvas')) {
        return 'Wall Art';
    } else if (titleLower.includes('sticker') || titleLower.includes('decal')) {
        return 'Stickers';
    } else {
        // Use blueprint ID to determine category
        const blueprintCategories = {
            3: 'Apparel', // T-shirt
            6: 'Drinkware', // Mug
            26: 'Bags', // Tote bag
            30: 'Accessories', // Phone case
            384: 'Wall Art' // Poster
        };
        return blueprintCategories[blueprintId] || 'Other';
    }
}

// Helper function to create sample products if none exist
async function createSampleProducts(shopId) {
    console.log('🎨 No products found. You can create products in your Printify dashboard.');
    console.log('💡 For now, keeping existing demo products with crypto payment integration.');
    console.log('🔗 Printify Dashboard: https://printify.com/app/products');
    console.log(`📍 Shop ID: ${shopId}`);
}

// Run the sync
syncPrintifyProducts();
