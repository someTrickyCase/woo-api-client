# WooCommerce API Client

![Tests](https://img.shields.io/github/actions/workflow/status/someTrickyCase/woo-api-client/ci.yaml?branch=main)
![Coverage](https://img.shields.io/badge/coverage-96%25-brightgreen)
![Version](https://img.shields.io/npm/v/woo-api-client)
![License](https://img.shields.io/npm/l/woo-api-client)
![Security](https://img.shields.io/github/actions/workflow/status/someTrickyCase/woo-api-client/security.yaml?branch=main&label=security)

A TypeScript WooCommerce REST API client with multi-store support, batch operations, and image upload capabilities.

## Features

- 🏪 **Multi-store Management** - Work with multiple WooCommerce stores simultaneously
- 🖼️ **Image Upload** - Upload images to WordPress media library
- 📦 **Batch Operations** - Create/update multiple products in single request
- 🏷️ **Product Management** - Full CRUD operations for products, categories, attributes
- 🛡️ **Type Safety** - Full TypeScript support with comprehensive types
- 🔄 **Automatic Retries** - Built-in retry logic for failed requests
- 🧪 **Tested** - 96% test coverage with unit, e2e, and integration tests

## Installation

```bash
npm install woo-api-client
```

## Quick Start

```typescript
import { WooClient } from "woo-api-client";

// Initialize client with store credentials
const client = new WooClient();
client.addStore("main", {
	store_url: "https://your-store.com",
	wc_key: "your_consumer_key",
	wc_secret: "your_consumer_secret",
	wp_username: "your_wp_username",
	wp_app_pass: "your_application_password",
});

// Select store and start using API
const store = client.selectStore("main");
```

## Multi-Store Management

```typescript
const client = new WooClient();

// Add multiple stores
client.addStore('primary', { /_ credentials _/ });
client.addStore('backup', { /_ credentials _/ });
client.addStore('dev', { /_ credentials _/ });

// Switch between stores
const primaryStore = client.selectStore('primary');
const backupStore = client.selectStore('backup');

// Get all stores
const allStores = client.selectAllStores();

// Remove stores
client.removeStore('dev');
client.removeAllStores();
```

## Product Management

### Create Products

```typescript
// Create single product
const products = await store.createProducts([
	{
		name: "Awesome Product",
		sku: "AP-001",
		price: 2999,
		description: "Product description",
		shortDescription: "Short desc",
		featuredImage: "/path/to/featured.jpg",
		images: ["/path/to/gallery1.jpg", "/path/to/gallery2.jpg"],
		categories: [{ id: 123 }],
		attributes: [
			{
				id: 1, // attribute ID
				options: ["Samsung"], // attribute values
			},
		],
	},
]);
```

### Update Product Prices

```typescript
// Update prices for multiple products
const result = await store.updatePrices({
	"SKU-001": 1999,
	"SKU-002": 2499,
	"SKU-003": 2999,
});
```

### Get Product IDs by SKUs

```typescript
// Get product IDs for batch operations
const productIds = await store.getProductIdsBySkus(["SKU-001", "SKU-002", "SKU-003"]);
// Returns: [{ sku: 'SKU-001', id: 123 }, { sku: 'SKU-002', id: 124 }, ...]
```

## Media Management

### Upload Images

```typescript
// Upload images to WordPress media library
const uploadedImages = await store.uploadImages(["/path/to/image1.jpg", "/path/to/image2.png"]);

// Returns: [{ id: 123 }, { id: 124 }] - use these IDs in product creation
```

## Catalog Management

### Get Categories

```typescript
const categories = await store.getCategories();
// Returns all product categories
```

### Get Attributes

```typescript
const attributes = await store.getAttributes();
// Returns all product attributes
```

### Get Manufacturers

```typescript
const manufacturers = await store.getManufacturers();
// Returns manufacturer attribute values
```

## Error Handling

```typescript
try {
	await store.createProducts(productsData);
} catch (error) {
	if (error.message.includes("HTTP 4")) {
		// Client error (bad request, unauthorized, etc.)
		console.error("Client error:", error.message);
	} else {
		// Network error or server error - automatically retried
		console.error("Request failed after retries:", error.message);
	}
}
```

## API Reference

### WooClient Class

| Method                       | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `addStore(key, credentials)` | Add store with credentials                  |
| `selectStore(key)`           | Get Store instance for specific store       |
| `selectAllStores()`          | Get array of Store instances for all stores |
| `removeStore(key)`           | Remove store by key                         |
| `removeAllStores()`          | Remove all stores                           |

### Store Class

| Method                       | Description                          |
| ---------------------------- | ------------------------------------ |
| `createProducts(products)`   | Create multiple products with images |
| `updatePrices(priceUpdates)` | Update prices for multiple products  |
| `getProductIdsBySkus(skus)`  | Get product IDs by SKU array         |
| `uploadImages(imagePaths)`   | Upload images to media library       |
| `getCategories()`            | Get all product categories           |
| `getAttributes()`            | Get all product attributes           |
| `getManufacturers()`         | Get manufacturer values              |

### Types

```typescript
interface ProductType {
	name: string;
	sku: string;
	price: number;
	description?: string;
	shortDescription?: string;
	featuredImage?: string;
	images?: string[];
	categories?: Array<{ id: number }>;
	attributes?: Array<{
		id: number;
	}>;
}

interface CredentialsType {
	store_url: string;
	wc_key: string;
	wc_secret: string;
	wp_username?: string;
	wp_app_pass?: string;
}
```

## Testing

```bash

# Run all tests

npm test

# Run unit tests only

npm run test:unit

# Run e2e tests only

npm run test:e2e

# Run with coverage

npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Telegram: https://t.me/snowinboots
- 🐛 [Issues](https://github.com/someTrickyCase/woo-api-client/issues)
- 💬 [Discussions](https://github.com/someTrickyCase/woo-api-client/discussions)

---

Built with :coconut:and TypeScript
