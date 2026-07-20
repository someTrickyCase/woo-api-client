import mapProduct from "./mappers/productToWoo";
import Connection from "./services/Connection";
import {
	CategoryType,
	CreateAttributeType,
	CreateCategoryType,
	CreateTagType,
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

	private get wcConnection() {
		return new Connection(this.credentials.store_url, {
			key: this.credentials.wc_key,
			secret: this.credentials.wc_secret,
		});
	}
	private get wpConnection() {
		return new Connection(this.credentials.store_url, {
			key: this.credentials.wp_username,
			secret: this.credentials.wp_app_pass,
		});
	}
	private get(endpoint: string) {
		return this.wcConnection.get(endpoint);
	}
	private static batch<T>(items: T[], size = 50): T[][] {
		const result: T[][] = [];

		for (let i = 0; i < items.length; i += size) {
			result.push(items.slice(i, i + size));
		}

		return result;
	}
	private async executeProductBatch(
		action: "create",
		batchedData: ProductType[][],
	): Promise<{ create: any[]; errors?: string[] }>;
	private async executeProductBatch(
		action: "update",
		batchedData: UpdateProductType[][],
	): Promise<{ update: any[]; errors?: string[] }>;
	private async executeProductBatch<T extends ProductType | UpdateProductType>(
		action: "create" | "update",
		batchedData: T[][],
	) {
		const allResults: { [action]: never[]; error: unknown }[] = [];
		for (let batchIndex = 0; batchIndex < batchedData.length; batchIndex++) {
			const batch = batchedData[batchIndex];

			console.log(
				`Processing batch ${batchIndex + 1}/${batchedData.length} (${batch.length} products)...`,
			);

			const data = await Promise.all(
				batch.map((product) =>
					mapProduct(product, this.uploadImages.bind(this)),
				),
			);

			try {
				const batchResult = await this.wcConnection.post(
					"/wp-json/wc/v3/products/batch",
					JSON.stringify({
						[action]: data,
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
					[action]: [],
					error: `Batch ${batchIndex + 1} failed: ${
						error instanceof Error ? error.message : "unknown error"
					}`,
				});
			}
		}

		return {
			[action]: allResults.flatMap((result) => result[action] || []),
			...(allResults.some((result) => result.error) && {
				errors: allResults
					.filter((result) => result.error)
					.map((result) => result.error),
			}),
		};
	}
	private async createBatch<T>(endpoint: string, data: T[]) {
		if (data.length === 0) {
			return { create: [] };
		}

		return this.wcConnection.post(
			endpoint,
			JSON.stringify({
				create: data,
			}),
		);
	}

	// images
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

			const data = await this.wpConnection.post(
				"/wp-json/wp/v2/media",
				formData,
			);

			results.push({
				id: data.id,
			});
		}

		return results;
	}

	// products
	async getAllProducts() {
		return await this.wcConnection.get("/wp-json/wc/v3/products");
	}
	async createProducts(productsData: ProductType[]) {
		if (productsData.length === 0) {
			return { create: [] };
		}

		const batchedData: ProductType[][] = Store.batch(productsData);
		return await this.executeProductBatch("create", batchedData);
	}
	async updateProducts(productsData: UpdateProductType[]) {
		if (productsData.length === 0) {
			return { update: [] };
		}

		const batchedData: UpdateProductType[][] = Store.batch(productsData);
		return await this.executeProductBatch("update", batchedData);
	}

	// categories
	async getCategories() {
		return this.get("/wp-json/wc/v3/products/categories");
	}
	async createCategories(categories: CreateCategoryType[]) {
		return this.createBatch(
			"/wp-json/wc/v3/products/categories/batch",
			categories,
		);
	}

	// attributes
	async getAttributes() {
		return await this.wcConnection.get("/wp-json/wc/v3/products/attributes/");
	}
	async createAttributes(attributes: CreateAttributeType[]) {
		return this.createBatch(
			"/wp-json/wc/v3/products/attributes/batch",
			attributes,
		);
	}
	async createAttributeTerms(
		attributeId: number,
		terms: CreateAttributeType[],
	) {
		if (terms.length === 0) {
			return { create: [] };
		}

		return await this.wcConnection.post(
			`/wp-json/wc/v3/products/attributes/${attributeId}/terms/batch`,
			JSON.stringify({
				create: terms,
			}),
		);
	}
	async getAttributeTerms(attributeId: number) {
		return await this.wcConnection.get(
			`/wp-json/wc/v3/products/attributes/${attributeId}/terms/`,
		);
	}

	// manufacturers
	private async getManufacturerAttribute() {
		const attrs = await this.getAttributes();

		const manufacturer = attrs.find(
			(a: CategoryType) => a.slug === "pa_proizvoditel",
		);

		if (!manufacturer) {
			throw new Error("Manufacturer attribute not found");
		}

		return manufacturer;
	}
	async getManufacturers(): Promise<ManufacturerType[]> {
		if (this.manufacturersCache) return this.manufacturersCache;

		const manufacturer = await this.getManufacturerAttribute();

		if (!manufacturer) {
			throw new Error("Manufacturer attribute not found");
		}

		const data = await this.wcConnection.get(
			`/wp-json/wc/v3/products/attributes/${manufacturer.id}/terms`,
		);

		this.manufacturersCache = data;

		return data;
	}
	async createManufacturers(manufacturers: CreateAttributeType[]) {
		const manufacturer = await this.getManufacturerAttribute();

		if (!manufacturer) {
			throw new Error("Manufacturer attribute not found");
		}

		return this.createAttributeTerms(manufacturer.id, manufacturers);
	}

	// tags
	async getTags() {
		return this.get("/wp-json/wc/v3/products/tags");
	}
	async createTags(tags: CreateTagType[]) {
		return this.createBatch("/wp-json/wc/v3/products/tags/batch", tags);
	}

	async getProductIdsBySkus(
		skus: string[],
	): Promise<Array<{ sku: string; id: number | null }>> {
		if (skus.length === 0) return [];

		const encodedSkus = skus.map((sku) => encodeURIComponent(sku)).join(",");
		const products = await this.wcConnection.get(
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

	/**
	 * @deprecated Use updateProducts() instead.
	 */
	async updatePrices(priceUpdates: { [sku: string]: number }) {
		const ids = await this.getProductIdsBySkus(Object.keys(priceUpdates));

		return this.updateProducts(
			ids
				.filter((p) => p.id)
				.map((p) => ({
					id: p.id!,
					price: priceUpdates[p.sku],
				})),
		);
	}
}
