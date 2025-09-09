#!/usr/bin/env node

/**
 * Product Population Script
 * Syncs products from Printify API to local database
 */

const path = require('path');

// Import from correct paths
const { initializeDatabase, getDatabase } = require('../config/database');
const Product = require('../models/Product');

async function populateProducts() {
    console.log('🔄 Starting product population...');
    
    try {
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database connected');
        
        // Create sample products directly
        await createSampleProducts();
        
    } catch (error) {
        console.error('❌ Product population failed:', error);
        console.log('🔄 Creating sample products as fallback...');
        await createSampleProducts();
    }
}

async function createSampleProducts() {
    console.log('📝 Creating sample products...');
    
    const sampleProducts = [
        {
            title: 'Solana T-Shirt',
            description: 'Premium Solana-themed t-shirt made from 100% organic cotton',
            price: 25.99,
            category: 'Apparel',
            image: '/public/images/solana-tshirt.jpg',
            inventory: 100,
            isActive: true,
            featured: true
        },
        {
            title: 'Crypto Hoodie',
            description: 'Comfortable hoodie with cryptocurrency design',
            price: 45.99,
            category: 'Apparel',
            image: '/public/images/crypto-hoodie.jpg',
            inventory: 75,
            isActive: true,
            featured: true
        },
        {
            title: 'Blockchain Mug',
            description: 'Start your day with blockchain technology',
            price: 15.99,
            category: 'Accessories',
            image: '/public/images/blockchain-mug.jpg',
            inventory: 200,
            isActive: true,
            featured: false
        },
        {
            title: 'DeFi Sticker Pack',
            description: 'Collection of 10 DeFi protocol stickers',
            price: 9.99,
            category: 'Accessories',
            image: '/public/images/defi-stickers.jpg',
            inventory: 500,
            isActive: true,
            featured: false
        },
        {
            title: 'NFT Art Canvas',
            description: 'High-quality canvas print of digital art',
            price: 79.99,
            category: 'Art',
            image: '/public/images/nft-canvas.jpg',
            inventory: 25,
            isActive: true,
            featured: true
        }
    ];
    
    let createdCount = 0;
    
    for (const productData of sampleProducts) {
        try {
            // Check if product with similar title exists
            const existing = await Product.findByTitle(productData.title);
            
            if (existing) {
                console.log(`⏭️ Sample product ${productData.title} already exists, skipping...`);
                continue;
            }
            
            const newProduct = await Product.create(productData);
            createdCount++;
            
            console.log(`✅ Created sample product: ${newProduct.title} (${newProduct.id})`);
            
        } catch (error) {
            console.error(`❌ Error creating sample product ${productData.title}:`, error.message);
        }
    }
    
    console.log(`🎉 Successfully created ${createdCount} sample products!`);
}

// Add findByTitle method to Product model if it doesn't exist
async function addFindByTitleMethod() {
    if (!Product.findByTitle) {
        Product.findByTitle = async function(title) {
            const db = getDatabase();
            return new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM products WHERE title = ? LIMIT 1',
                    [title],
                    (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row ? Product(row) : null);
                        }
                    }
                );
            });
        };
    }
}

// Run the script
if (require.main === module) {
    addFindByTitleMethod();
    populateProducts()
        .then(() => {
            console.log('🏁 Product population completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Product population failed:', error);
            process.exit(1);
        });
}

module.exports = { populateProducts, createSampleProducts };
