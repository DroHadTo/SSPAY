// test-printify.js - Test Printify API connection
require('dotenv').config();
const axios = require('axios');

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;

async function testPrintifyConnection() {
    console.log('🧪 Testing Printify API Connection...');
    console.log('📊 API Token present:', !!PRINTIFY_API_TOKEN);
    console.log('🔗 API Base URL:', PRINTIFY_API_BASE);
    
    if (!PRINTIFY_API_TOKEN) {
        console.error('❌ PRINTIFY_API_TOKEN not found in environment variables');
        return;
    }
    
    try {
        // Test basic API connectivity
        const response = await axios.get(`${PRINTIFY_API_BASE}/shops.json`, {
            headers: {
                'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'CryptoDropship/1.0'
            },
            timeout: 10000
        });
        
        console.log('✅ Printify API Connection Successful!');
        console.log('📊 Status:', response.status);
        console.log('🏪 Shops found:', response.data?.length || 0);
        
        if (response.data && response.data.length > 0) {
            console.log('🏪 First Shop Details:');
            const shop = response.data[0];
            console.log('   - ID:', shop.id);
            console.log('   - Title:', shop.title);
            console.log('   - Sales Channel:', shop.sales_channel);
        }
        
        // Test catalog endpoints
        console.log('\n🧪 Testing Catalog Endpoints...');
        const blueprintsResponse = await axios.get(`${PRINTIFY_API_BASE}/catalog/blueprints.json`, {
            headers: {
                'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ Catalog API Working!');
        console.log('📚 Blueprints available:', blueprintsResponse.data?.length || 0);
        
        if (blueprintsResponse.data && blueprintsResponse.data.length > 0) {
            console.log('📚 Sample Blueprint:');
            const blueprint = blueprintsResponse.data[0];
            console.log('   - ID:', blueprint.id);
            console.log('   - Title:', blueprint.title);
            console.log('   - Description:', blueprint.description);
        }
        
    } catch (error) {
        console.error('❌ Printify API Connection Failed!');
        console.error('📊 Status:', error.response?.status);
        console.error('📝 Message:', error.response?.data?.message || error.message);
        console.error('🔗 URL:', error.config?.url);
        
        if (error.response?.status === 401) {
            console.error('🔐 Authentication failed - check your API token');
        } else if (error.response?.status === 403) {
            console.error('🚫 Access forbidden - check your API permissions');
        } else if (error.response?.status === 429) {
            console.error('⏱️  Rate limit exceeded - wait before retrying');
        }
    }
}

// Run the test
testPrintifyConnection();
