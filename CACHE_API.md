# Cache Management API

This document describes the cache management endpoints available in the Stile Sagio backend.

## Cache Configuration

- **Cache Duration**: 72 hours (3 days) for both products and banners
- **Cache Type**: In-memory cache using JavaScript Map
- **Auto-clear**: Cache is automatically cleared when products/banners are updated

## Endpoints

### 1. Get Cache Statistics

**GET** `/cache/stats`

Returns statistics about the current cache state.

**Response:**
```json
{
  "success": true,
  "message": "Cache statistics retrieved successfully",
  "data": {
    "totalEntries": 2,
    "activeEntries": 2,
    "expiredEntries": 0,
    "keys": ["home_products_v1", "banner_data"]
  }
}
```

### 2. Clear All Cache

**POST** `/cache/clear`

**DELETE** `/cache/clear`

Clears all cached data.

**Response:**
```json
{
  "success": true,
  "message": "All cache cleared successfully"
}
```

### 3. Clear Specific Cache

**POST** `/cache/clear`

**Body:**
```json
{
  "key": "home_products_v1"
}
```

**DELETE** `/cache/clear?key=home_products_v1`

Clears cache for a specific key.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared for key: home_products_v1"
}
```

### 4. Clear Banner Cache

**POST** `/cache/clear-banner`

Clears only the banner cache.

**Response:**
```json
{
  "success": true,
  "message": "Banner cache cleared successfully"
}
```

## Cache Keys

- `home_products_v1`: Cached product data for home page
- `banner_data`: Cached banner data

## Usage Examples

### Clear cache when updating products
```bash
curl -X POST http://localhost:3000/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"key": "home_products_v1"}'
```

### Clear all cache
```bash
curl -X DELETE http://localhost:3000/cache/clear
```

### Get cache statistics
```bash
curl -X GET http://localhost:3000/cache/stats
```

## Automatic Cache Management

The cache is automatically cleared when:
- New banner is created (`POST /banner/create`)
- Banner is deleted (`DELETE /banner/delete`)
- Products are updated (via cache clearing endpoints)

## Notes

- Cache duration is set to 72 hours as products and banners don't change frequently
- Cache is stored in memory and will be cleared when the server restarts
- Use the cache clearing endpoints when updating products or banners to ensure fresh data is served
