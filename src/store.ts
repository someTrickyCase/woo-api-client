import mapProduct from "./mappers/productToWoo";
import Connection from "./services/Connection";
import {
	CategoryType,
	CredentialsType,
	ManufacturerType,
	ProductType,
	UpdateProductType,
} from "./types/types";
import * as fs from "node:fs";

export default class Store {
	credentials: CredentialsType;
	manufacturersCache: ManufacturerType[] | null = null;

	constructor(credentials: CredentialsType) {
		this.credentials = credentials;
	}

	async uploadImages(imagePaths: string[]): Promise<Array<{ id: number }>> {
		const results = [];

		for (const imagePath of imagePaths) {
			if (!fs.existsSync(imagePath)) {
				throw new Error(`File not found: ${imagePath}`);
			}

			const fileBuffer = fs.readFileSync(imagePath);
			const formData = new FormData();
			const blob = new Blob([fileBuffer]);
			const filename = imagePath.split("/").pop() || "image.jpg";
			formData.append("file", blob, filename);

			const connection = new Connection(this.credentials.store_url, {
				key: this.credentials.wp_username,
				secret: this.credentials.wp_app_pass,
			});

			const data = await connection.post("/wp-json/wp/v2/media", formData);

			results.push({
				id: data.id,
			});
		}

		return results;
	}

	async getCategories() {
		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});
		return await connection.get("/wp-json/wc/v3/products/categories");
	}

	async getAllProducts() {
		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});
		return await connection.get("/wp-json/wc/v3/products");
	}

	async getAttributes() {
		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		return await connection.get("/wp-json/wc/v3/products/attributes/");
	}

	async getManufacturers() {
		if (this.manufacturersCache) return this.manufacturersCache;

		const attributes = await this.getAttributes();
		const manufacturerAttribute = attributes.find(
			(attr: CategoryType) => attr.slug === "pa_proizvoditel",
		);

		if (!manufacturerAttribute) {
			throw new Error("Manufacturer attribute not found");
		}

		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		const data = await connection.get(
			`/wp-json/wc/v3/products/attributes/${manufacturerAttribute.id}/terms`,
		);

		this.manufacturersCache = data;

		return this.manufacturersCache;
	}

	async getTags() {
		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		return await connection.get("/wp-json/wc/v3/products/tags");
	}

	async getProductIdsBySkus(
		skus: string[],
	): Promise<Array<{ sku: string; id: number | null }>> {
		if (skus.length === 0) return [];

		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		const encodedSkus = skus.map((sku) => encodeURIComponent(sku)).join(",");
		const products = await connection.get(
			`/wp-json/wc/v3/products?sku=${encodedSkus}`,
		);

		const foundMap = new Map();
		products.forEach((product: any) => {
			if (product.sku) {
				foundMap.set(product.sku, product.id);
			}
		});

		return skus.map((sku) => ({
			sku,
			id: foundMap.get(sku) || null,
		}));
	}

	async updatePrices(priceUpdates: { [sku: string]: number }) {
		const seekedSkus: string[] = Object.keys(priceUpdates);
		const idSkuPairs = await this.getProductIdsBySkus(seekedSkus);

		let idPricePairs: { id: number; regular_price: string }[] = [];
		idSkuPairs.forEach((pair) => {
			if (!pair.id) return;
			idPricePairs.push({
				id: pair.id,
				regular_price: priceUpdates[pair.sku].toString(),
			});
		});

		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		return await connection.post(
			"/wp-json/wc/v3/products/batch",
			JSON.stringify({
				update: idPricePairs,
			}),
		);
	}

	async updateProducts(productsData: UpdateProductType[]) {
		if (productsData.length === 0) {
			return { update: [] };
		}

		const BATCH_SIZE = 50;
		const batchedData: UpdateProductType[][] = [];

		for (let i = 0; i < productsData.length; i += BATCH_SIZE) {
			batchedData.push(productsData.slice(i, i + BATCH_SIZE));
		}

		const allResults: any[] = [];

		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		for (let batchIndex = 0; batchIndex < batchedData.length; batchIndex++) {
			const batch = batchedData[batchIndex];

			console.log(
				`Processing batch ${batchIndex + 1}/${batchedData.length} (${batch.length} products)...`,
			);

			const updateData = await Promise.all(
				batch.map((product) =>
					mapProduct(product, this.uploadImages.bind(this)),
				),
			);

			try {
				const batchResult = await connection.post(
					"/wp-json/wc/v3/products/batch",
					JSON.stringify({
						update: updateData,
					}),
				);

				allResults.push(batchResult);
				console.log(`✅ Batch ${batchIndex + 1} completed successfully`);

				if (batchIndex < batchedData.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			} catch (error) {
				console.error(`❌ Failed to process batch ${batchIndex + 1}:`, error);
				allResults.push({
					update: [],
					error: `Batch ${batchIndex + 1} failed: ${
						error instanceof Error ? error.message : "unknown error"
					}`,
				});
			}
		}

		return {
			update: allResults.flatMap((result) => result.update || []),
			...(allResults.some((result) => result.error) && {
				errors: allResults
					.filter((result) => result.error)
					.map((result) => result.error),
			}),
		};
	}

	async createProducts(productsData: ProductType[]) {
		if (productsData.length === 0) {
			return { create: [] };
		}

		const BATCH_SIZE = 50;
		const batchedData: ProductType[][] = [];

		for (let i = 0; i < productsData.length; i += BATCH_SIZE) {
			batchedData.push(productsData.slice(i, i + BATCH_SIZE));
		}

		const allResults: any[] = [];

		const connection = new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});

		for (let batchIndex = 0; batchIndex < batchedData.length; batchIndex++) {
			const batch = batchedData[batchIndex];

			console.log(
				`Processing batch ${batchIndex + 1}/${batchedData.length} (${batch.length} products)...`,
			);

			const createData = await Promise.all(
				batch.map((product) =>
					mapProduct(product, this.uploadImages.bind(this)),
				),
			);

			try {
				const batchResult = await connection.post(
					"/wp-json/wc/v3/products/batch",
					JSON.stringify({
						create: createData,
					}),
				);

				allResults.push(batchResult);
				console.log(`✅ Batch ${batchIndex + 1} completed successfully`);

				if (batchIndex < batchedData.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 200));
				}
			} catch (error) {
				console.error(`❌ Failed to process batch ${batchIndex + 1}:`, error);
				allResults.push({
					create: [],
					error: `Batch ${batchIndex + 1} failed: ${
						error instanceof Error ? error.message : "unknown error"
					}`,
				});
			}
		}

		return {
			create: allResults.flatMap((result) => result.create || []),
			...(allResults.some((result) => result.error) && {
				errors: allResults
					.filter((result) => result.error)
					.map((result) => result.error),
			}),
		};
	}
}
