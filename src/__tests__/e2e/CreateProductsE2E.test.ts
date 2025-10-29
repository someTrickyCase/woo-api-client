import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";
import { WooClient } from "../../index";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Helper function with timeout
const fetchWithTimeout = async (url: string, options: any = {}, timeout = 15000) => {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);
		return response;
	} catch (error) {
		clearTimeout(id);
		throw error;
	}
};

describe("Create Products Integration Test", () => {
	let wooClient: WooClient;
	let store: Store;
	let testSkus: string[] = [];

	beforeAll(() => {
		const credentials = {
			store_url: process.env.STORE_URL!,
			wc_key: process.env.WC_KEY!,
			wc_secret: process.env.WC_SECRET!,
			wp_username: process.env.WP_USERNAME!,
			wp_app_pass: process.env.WP_APP_PASSWORD!,
		};

		wooClient = new WooClient();
		wooClient.addStore("test", credentials);
		store = wooClient.selectStore("test");
	});

	afterAll(async () => {
		// Cleanup any remaining test products
		if (testSkus.length > 0) {
			const productIds = await store.getProductIdsBySkus(testSkus);

			for (const product of productIds) {
				if (product.id) {
					try {
						await fetchWithTimeout(
							`${process.env.STORE_URL!}/wp-json/wc/v3/products/${product.id}?force=true`,
							{
								method: "DELETE",
								headers: {
									Authorization:
										"Basic " +
										Buffer.from(`${process.env.WC_KEY!}:${process.env.WC_SECRET!}`).toString(
											"base64"
										),
								},
							},
							10000
						);
					} catch (error) {
						console.log(`Failed to cleanup product ${product.id}:`, error);
					}
				}
			}
		}
	});

	it("should create two products - one with images, one without", async () => {
		const timestamp = Date.now();
		const testProductWithImagesSku = `TEST-IMG-${timestamp}-1`;
		const testProductWithoutImagesSku = `TEST-NOIMG-${timestamp}-2`;

		testSkus = [testProductWithImagesSku, testProductWithoutImagesSku];
		const testProducts = [
			{
				name: `Test Product With Images - ${timestamp}`,
				sku: testProductWithImagesSku,
				price: 1999,
				description: "This product should have images attached",
				shortDescription: "With images",
				images: [path.resolve(process.cwd(), "test-images/image1.png")],
			},
			{
				name: `Test Product Without Images - ${timestamp}`,
				sku: testProductWithoutImagesSku,
				price: 2999,
				description: "This product should have no images",
				shortDescription: "No images",
				// No images array
			},
		];
		const createResult = await store.createProducts(testProducts);

		expect(createResult.create).toHaveLength(2);
		expect(createResult.create[0]).toHaveProperty("id");
		expect(createResult.create[1]).toHaveProperty("id");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		for (const sku of testSkus) {
			const response = await fetchWithTimeout(
				`${process.env.STORE_URL!}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`,
				{
					headers: {
						Authorization:
							"Basic " +
							Buffer.from(`${process.env.WC_KEY!}:${process.env.WC_SECRET!}`).toString("base64"),
					},
				},
				10000
			);

			expect(response.ok).toBe(true);
			const products = await response.json();

			expect(Array.isArray(products)).toBe(true);
			expect(products).toHaveLength(1); // Should find exactly one product per SKU

			const product = products[0];
			expect(product.sku).toBe(sku);
			expect(product.name).toContain("Test Product");
			expect(product.price).toBeDefined();

			if (sku === testProductWithImagesSku) {
				expect(product.images).toHaveLength(1); // Should have one image
				expect(product.images[0]).toHaveProperty("id");
				expect(product.images[0]).toHaveProperty("src");
			} else {
				expect(product.images).toHaveLength(0); // Should have no images
			}
		}
	}, 120000);

	it("should create product with featured image as first in gallery", async () => {
		const timestamp = Date.now();
		const testSku = `TEST-FEATURED-${timestamp}`;

		const testProducts = [
			{
				name: `Product with Featured Image - ${timestamp}`,
				sku: testSku,
				price: 2499,
				description: "Testing featured image functionality",
				featuredImage: path.resolve(process.cwd(), "test-images/image1.png"),
				images: [path.resolve(process.cwd(), "test-images/image2.png")],
			},
		];

		const createResult = await store.createProducts(testProducts);
		expect(createResult.create[0]).toHaveProperty("id");

		const response = await fetch(
			`${process.env.STORE_URL!}/wp-json/wc/v3/products?sku=${testSku}`,
			{
				headers: {
					Authorization:
						"Basic " +
						Buffer.from(`${process.env.WC_KEY!}:${process.env.WC_SECRET!}`).toString("base64"),
				},
			}
		);

		const products = await response.json();
		const product = products[0];

		expect(product.images).toHaveLength(2);
		expect(product.images[0].id).toBeDefined();
		expect(product.images[1].id).toBeDefined();

		await fetch(`${process.env.STORE_URL!}/wp-json/wc/v3/products/${product.id}?force=true`, {
			method: "DELETE",
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(`${process.env.WC_KEY!}:${process.env.WC_SECRET!}`).toString("base64"),
			},
		});
	});
});
