# WooCommerce API Client

A modern TypeScript client for the WooCommerce REST API focused on **catalog synchronization**, **batch operations**, and **automation**.

Unlike generic REST wrappers, this library provides high-level methods for synchronizing products, categories, attributes, tags and media with WooCommerce.

Perfect for ERP integrations, supplier feeds, AI-powered product pipelines and custom import tools.

---

## Features

- 🏪 Multi-store support
- 📦 Batch product creation
- ✏️ Batch product updates
- 💰 Batch price updates
- 🖼️ Automatic image uploads
- 📂 Category synchronization
- 🏷️ Tag synchronization
- 🎨 Attribute & term synchronization
- 📋 Retrieve complete WooCommerce catalog
- 🔄 Automatic retry mechanism
- 🛡️ Fully typed TypeScript API
- 🧪 High test coverage

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
	store_url: "https://your-store.com",

	wc_key: process.env.WC_KEY!,
	wc_secret: process.env.WC_SECRET!,

	wp_username: process.env.WP_USERNAME!,
	wp_app_pass: process.env.WP_APP_PASSWORD!,
});

const store = client.selectStore("main");
```

---

# Multi-Store Support

Register as many WooCommerce stores as needed.

```ts
const client = new WooClient();

client.addStore("production", credentials);
client.addStore("staging", credentials);
client.addStore("development", credentials);

const production = client.selectStore("production");

const allStores = client.selectAllStores();
```

Remove stores when no longer needed.

```ts
client.removeStore("development");

client.removeAllStores();
```

---

# Product Creation

Create one or many products in a single request.

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
			"./images/back.jpg",
			"./images/side.jpg",
		],

		categories: [
			{ id: 15 },
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

Images are automatically uploaded to the WordPress Media Library before creating the product.

---

# Product Updates

Update only the fields you want to change.

```ts
await store.updateProducts([
	{
		id: 125,

		price: 899,

		shortDescription: "Limited time offer!",

		images: [
			"./updated-image.jpg",
		],
	},
]);
```

---

# Update Prices

Update prices for multiple products using SKUs.

```ts
await store.updatePrices({
	"SKU-001": 1999,
	"SKU-002": 2499,
	"SKU-003": 2999,
});
```

---

# Upload Images

Upload images directly to the WordPress Media Library.

```ts
const uploaded = await store.uploadImages([
	"./images/front.jpg",
	"./images/back.jpg",
]);

console.log(uploaded);

// [
//   { id: 123 },
//   { id: 124 }
// ]
```

---

# Upload Categories

Create categories that do not already exist.

```ts
await store.uploadCategories([
	"Phones",
	"Accessories",
	"Chargers",
]);
```

---

# Upload Tags

```ts
await store.uploadTags([
	"Samsung",
	"Android",
	"Wireless Charging",
]);
```

---

# Upload Attributes

Create attributes and their terms.

```ts
await store.uploadAttributes([
	{
		name: "Brand",

		values: [
			"Samsung",
			"Apple",
			"Google",
		],
	},
	{
		name: "Color",

		values: [
			"Black",
			"White",
			"Blue",
		],
	},
]);
```

---

# Retrieve Products

Retrieve the entire WooCommerce catalog.

```ts
const products = await store.getAllProducts();
```

Resolve WooCommerce IDs from SKUs.

```ts
const ids = await store.getProductIdsBySkus([
	"SKU-001",
	"SKU-002",
	"SKU-003",
]);

// [
//   {
//     sku: "...",
//     id: ...
//   }
// ]
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

Retrieve manufacturer attribute values.

```ts
const manufacturers = await store.getManufacturers();
```

---

# Typical Synchronization Flow

```text
Supplier Feed
      │
      ▼
Normalize Data
      │
      ▼
uploadCategories()
      │
      ▼
uploadAttributes()
      │
      ▼
uploadTags()
      │
      ▼
createProducts()
      │
      ▼
updatePrices()
```

---

# Error Handling

All requests automatically retry transient failures.

```ts
try {
	await store.createProducts(products);
} catch (error) {
	console.error(error);
}
```

If all retry attempts fail, the request throws an exception.

---

# API Reference

## WooClient

| Method | Description |
|---------|-------------|
| `addStore()` | Register a WooCommerce store |
| `selectStore()` | Select a store |
| `selectAllStores()` | Retrieve all stores |
| `removeStore()` | Remove one store |
| `removeAllStores()` | Remove all stores |

---

## Store

| Method | Description |
|---------|-------------|
| `createProducts()` | Batch create products |
| `updateProducts()` | Batch update products |
| `updatePrices()` | Batch update prices |
| `uploadImages()` | Upload images |
| `uploadCategories()` | Synchronize categories |
| `uploadAttributes()` | Synchronize attributes & terms |
| `uploadTags()` | Synchronize tags |
| `getAllProducts()` | Retrieve all products |
| `getProductIdsBySkus()` | Resolve IDs from SKUs |
| `getCategories()` | Retrieve categories |
| `getAttributes()` | Retrieve attributes |
| `getManufacturers()` | Retrieve manufacturer values |

---

# Types

## Credentials

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

## Product

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

Run tests.

```bash
npm test
```

Run unit tests.

```bash
npm run test:unit
```

Run integration tests.

```bash
npm run test:e2e
```

Generate coverage report.

```bash
npm run test:coverage
```

---

# Contributing

Contributions, ideas and pull requests are always welcome.

---

# License

MIT

---

- 📬 Telegram: https://t.me/snowinboots

---

Built with TypeScript ❤️
