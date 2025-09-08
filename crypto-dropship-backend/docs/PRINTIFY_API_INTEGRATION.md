# Printify API Integration Guide

## Overview

This crypto dropshipping platform integrates with the official Printify API following all compliance requirements and best practices outlined in the [Printify API Documentation](https://developers.printify.com/).

## Compliance Features

### ✅ API Terms Compliance
- Follows [Printify Terms of Service](https://printify.com/terms-of-service/)
- Adheres to [Printify API Terms](https://printify.com/API-terms/)
- Implements proper rate limiting and error handling
- Maintains error rate below 5% threshold

### ✅ Rate Limiting
- **Global Limit**: 600 requests per minute ✓
- **Catalog Limit**: 100 requests per minute ✓
- **Publishing Limit**: 200 requests per 30 minutes ✓
- Built-in rate limiting with automatic tracking

### ✅ Authentication
- Uses Personal Access Token (PAT) for single merchant account
- Proper Authorization header: `Bearer {token}`
- Required User-Agent header: `Crypto-Dropship-Store/1.0`
- Auto-detection of shop ID if not configured

## Configuration

### Environment Variables
```env
# Printify API Configuration
PRINTIFY_API_TOKEN=your_jwt_token_here
PRINTIFY_SHOP_ID=auto_detect  # Optional, will auto-detect if not provided
```

### API Token Setup
1. Visit [Printify My Profile > Connections](https://printify.com/app/account/connections)
2. Generate a Personal Access Token
3. Set appropriate access scopes:
   - `shops.manage`
   - `shops.read`
   - `catalog.read`
   - `orders.read`
   - `orders.write`
   - `products.read`
   - `products.write`
   - `webhooks.read`
   - `webhooks.write`
   - `uploads.read`
   - `uploads.write`
   - `print_providers.read`
   - `user.info`

## API Endpoints

### Product Management

#### Get Products
```
GET /api/products
```
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `category` - Filter by category
- `search` - Search in title/description
- `is_published` - Filter published products
- `is_available` - Filter available products
- `price_min` / `price_max` - Price range filter
- `sync_printify=true` - Sync from Printify before returning

**Response:**
```json
{
  "success": true,
  "products": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "per_page": 20,
    "total_items": 100,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Sync Products from Printify
```
GET /api/products/sync
```
Manually trigger product synchronization from Printify.

#### Get Product Categories
```
GET /api/products/categories
```
Returns unique product categories from your catalog.

#### Get Single Product
```
GET /api/products/:id?include_analytics=true
```
Retrieve detailed product information with optional analytics.

### Printify Integration

#### Get Printify Shops
```
GET /api/products/printify/shops
```
List all shops in your Printify account.

#### Get Printify Catalog
```
GET /api/products/printify/catalog
```
Retrieve available product blueprints from Printify catalog.

#### API Usage Statistics
```
GET /api/products/stats/usage
```
Monitor your API usage and compliance status.

**Response:**
```json
{
  "success": true,
  "usage_stats": {
    "total_requests": 150,
    "error_requests": 2,
    "error_rate": "1.33%",
    "current_minute_requests": 45,
    "catalog_requests": 12,
    "publish_requests": 5,
    "limits": {
      "global": "600/minute",
      "catalog": "100/minute",
      "publishing": "200/30min",
      "error_rate": "< 5%"
    },
    "compliance": {
      "global": true,
      "catalog": true,
      "publishing": true,
      "error_rate": true
    }
  }
}
```

## Service Architecture

### PrintifyService Class
Located in `services/printifyService.js`, this service provides:

1. **Rate Limiting**: Automatic tracking and enforcement
2. **Error Monitoring**: Maintains error rate below 5%
3. **Auto-Detection**: Automatically detects shop ID
4. **Transformation**: Converts Printify data to internal format
5. **Compliance**: Full adherence to API terms

### Key Methods
```javascript
// Get products with pagination
await printifyService.getProducts({ page: 1, limit: 50 });

// Get single product
await printifyService.getProduct(productId);

// Create new product
await printifyService.createProduct(productData);

// Create order
await printifyService.createOrder(orderData);

// Get usage statistics
printifyService.getUsageStats();
```

## Database Integration

### Product Model
Products are synchronized between Printify and local SQLite database:

- **Local Storage**: Fast queries and caching
- **Printify Sync**: Regular updates from Printify API
- **Hybrid Approach**: Best of both worlds

### Sync Process
1. Fetch products from Printify API (paginated)
2. Transform to internal format
3. Create or update in local database
4. Track sync statistics

## Error Handling

### Rate Limit Handling
- Automatic detection of 429 errors
- Graceful degradation when limits approached
- Clear error messages for users

### Error Rate Monitoring
- Tracks all API requests and errors
- Warns when approaching 5% error threshold
- Provides detailed error statistics

## Security Best Practices

### Token Management
- Store tokens securely in environment variables
- Never expose tokens in client-side code
- Regular token rotation (tokens expire after 1 year)

### Request Headers
```javascript
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json',
  'User-Agent': 'Crypto-Dropship-Store/1.0',
  'Accept': 'application/json'
}
```

## Testing

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Product Sync
```bash
curl http://localhost:3000/api/products/sync
```

### Check Usage Stats
```bash
curl http://localhost:3000/api/products/stats/usage
```

## Monitoring & Analytics

### Usage Tracking
- Real-time rate limit monitoring
- Error rate tracking
- Request volume analytics
- Compliance status dashboard

### Alerts
- Rate limit warnings at 80% capacity
- Error rate alerts at 4%
- Failed sync notifications

## Best Practices

1. **Rate Limiting**: Always check current usage before making requests
2. **Error Handling**: Implement retry logic with exponential backoff
3. **Caching**: Use local database for frequently accessed data
4. **Monitoring**: Regular health checks and usage monitoring
5. **Compliance**: Follow all Printify terms and API guidelines

## Troubleshooting

### Common Issues

#### Rate Limit Exceeded
```
Error: Rate limit exceeded (600 requests/minute)
```
**Solution**: Implement request queuing or reduce request frequency.

#### Authentication Failed
```
Error: Unauthorized (401)
```
**Solution**: Check API token validity and regenerate if needed.

#### Shop Not Found
```
Error: No shops found in your Printify account
```
**Solution**: Create a shop in your Printify dashboard first.

### Debug Mode
Set `NODE_ENV=development` for detailed logging:
- Request/response logging
- Rate limit tracking
- Error details
- Sync progress

## Migration Guide

### From Old Implementation
1. Replace old Printify service with new compliant version
2. Update route imports in `server.js`
3. Test API endpoints
4. Monitor usage statistics
5. Verify compliance status

### Environment Updates
```env
# Old
PRINTIFY_TOKEN=...

# New
PRINTIFY_API_TOKEN=...
PRINTIFY_SHOP_ID=auto_detect
```

This implementation ensures full compliance with Printify's API terms while providing a robust, scalable integration for your crypto dropshipping platform.
