# WooCommerce API Client

A modern TypeScript client for the WooCommerce REST API with first-class support for multi-store applications, product synchronization, media uploads and batch operations.

Built for automation tools, ERP integrations and AI-powered product pipelines.

---

## Features

- 🏪 Multi-store support
- 📦 Batch create and update operations
- 🖼️ Automatic image uploads to the WordPress Media Library
- 🛍️ Complete product management
- 🏷️ Categories, attributes and manufacturer helpers
- 🔄 Automatic retry mechanism for transient failures
- 🧩 Fully typed TypeScript API
- 🧪 High test coverage with unit and integration tests

---

# Installation

```bash
npm install @sometrickycase/woo-api-client
```

---

# Quick Start

```ts
import { WooClient } from "@sometrickycase/woo-api-client";

const client = new WooClient();

client.addStore("main", {
	store_url: "https://example.com",
	wc_key: process.env.WC_KEY!,
	wc_secret: process.env.WC_SECRET!,
	wp_username: process.env.WP_USERNAME!,
	wp_app_pass: process.env.WP_APP_PASSWORD!,
});

const store = client.selectStore("main");
```

---

# Multi Store Support

```ts
const client = new WooClient();

client.addStore("production", {...});
client.addStore("staging", {...});
client.addStore("development", {...});

const production = client.selectStore("production");
const staging = client.selectStore("staging");

const stores = client.selectAllStores();
```

Remove stores when no longer needed.

```ts
client.removeStore("development");
client.removeAllStores();
```

---

# Creating Products

```ts
await store.createProducts([
	{
		name: "Samsung Galaxy S24",
		sku: "SM-S921",
		price: 999,

		description: "<p>Product description</p>",
		shortDescription: "Short description",

		featuredImage: "./images/main.jpg",

		images: [
			"./images/1.jpg",
			"./images/2.jpg",
		],

		categories: [
			{ id: 15 }
		],

		attributes: [
			{
				id: 3,
				options: ["Samsung"],
			},
			{
				id: 8,
				options: ["Black"],
			},
		],
	},
]);
```

Images are uploaded automatically before product creation.

---

# Updating Products

```ts
await store.updateProducts([
	{
		id: 152,

		price: 899,

		shortDescription: "Now even cheaper!",

		images: [
			"./updated-image.jpg",
		],
	},
]);
```

Only supplied fields are updated.

---

# Upload Images

```ts
const uploaded = await store.uploadImages([
	"./images/1.jpg",
	"./images/2.png",
]);

console.log(uploaded);

// [
//   { id: 123 },
//   { id: 124 }
// ]
```

---

# Update Prices

```ts
await store.updatePrices({
	"SKU-001": 1499,
	"SKU-002": 1899,
	"SKU-003": 999,
});
```

---

# Retrieve Products

```ts
const allProducts = await store.getAllProducts();

const ids = await store.getProductIdsBySkus([
	"SKU-001",
	"SKU-002",
]);
```

---

# Categories

```ts
const categories = await store.getCategories();
```

---

# Attributes

```ts
const attributes = await store.getAttributes();
```

---

# Manufacturers

```ts
const manufacturers = await store.getManufacturers();
```

---

# Error Handling

Every request automatically retries transient failures.

```ts
try {
	await store.createProducts(products);
} catch (error) {
	console.error(error);
}
```

Unexpected failures throw exceptions after all retry attempts have been exhausted.

---

# API Overview

## WooClient

| Method | Description |
|---------|-------------|
| addStore() | Register a WooCommerce store |
| selectStore() | Get a Store instance |
| selectAllStores() | Get all registered stores |
| removeStore() | Remove one store |
| removeAllStores() | Remove every store |

---

## Store

| Method | Description |
|---------|-------------|
| createProducts() | Batch create products |
| updateProducts() | Batch update products |
| updatePrices() | Batch update prices |
| uploadImages() | Upload images |
| getAllProducts() | Retrieve every product |
| getProductIdsBySkus() | Resolve IDs from SKUs |
| getCategories() | Get categories |
| getAttributes() | Get attributes |
| getManufacturers() | Get manufacturers |

---

# Credentials

```ts
interface CredentialsType {
	store_url: string;

	wc_key: string;
	wc_secret: string;

	wp_username?: string;
	wp_app_pass?: string;
}
```

---

# Product Type

```ts
interface ProductType {
	name: string;
	sku: string;

	price: number;

	description?: string;
	shortDescription?: string;

	featuredImage?: string;
	images?: string[];

	categories?: {
		id: number;
	}[];

	attributes?: {
		id: number;
		options: string[];
	}[];
}
```

---

# Development

```bash
npm test
```

Unit tests

```bash
npm run test:unit
```

Integration tests

```bash
npm run test:e2e
```

Coverage

```bash
npm run test:coverage
```

---

# Contributing

Contributions are welcome.

Feel free to open issues, discuss ideas or submit pull requests.

---

# License

MIT

---

# Links

- GitHub Issues
- GitHub Discussions
- Telegram: https://t.me/snowinboots

---

Made with TypeScript and ❤️
