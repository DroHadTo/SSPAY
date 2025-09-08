const PrintifyApiService = require('./services/printifyApi');

async function testPrintifyConnection() {
    const api = new PrintifyApiService();
    
    try {
        console.log('🔍 Testing Printify API connection...');
        
        // Test basic connection
        const connectionTest = await api.testConnection();
        console.log('Connection test:', connectionTest);
        
        // Get shops
        console.log('\n📋 Fetching your Printify shops...');
        const shops = await api.getShops();
        
        if (shops && shops.length > 0) {
            console.log('✅ Found shops:');
            shops.forEach(shop => {
                console.log(`  Shop ID: ${shop.id} - Name: "${shop.title}"`);
            });
            
            // Use first shop as default
            const shopId = shops[0].id;
            console.log(`\n🏪 Using Shop ID: ${shopId} as default`);
            
            // Update environment variable suggestion
            console.log('\n💡 Add this to your .env file:');
            console.log(`PRINTIFY_SHOP_ID=${shopId}`);
            
        } else {
            console.log('❌ No shops found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPrintifyConnection();
