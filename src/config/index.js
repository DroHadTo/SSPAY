require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Printify API Configuration
  PRINTIFY: {
    BASE_URL: 'https://api.printify.com/v1',
    API_KEY: process.env.PRINTIFY_API_KEY,
    SHOP_ID: process.env.PRINTIFY_SHOP_ID || '15002088'
  },
  
  // Solana Configuration
  SOLANA: {
    NETWORK: process.env.SOLANA_NETWORK || 'mainnet-beta',
    MERCHANT_WALLET: process.env.MERCHANT_WALLET || '89znXatBP5yXeA3JowynCwXTYqGSB833A9p96kfLcGkZ',
    RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  },
  
  // CORS Configuration
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    CREDENTIALS: true
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
  }
};
