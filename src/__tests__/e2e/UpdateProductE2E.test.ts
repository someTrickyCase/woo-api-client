import * as dotenv from "dotenv";
import path from "path";

import Store from "../../store";
import { WooClient } from "../../index";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

describe("Update Products Integration Test", () => {
	let wooClient: WooClient;
	let store: Store;

	beforeAll(() => {
		wooClient = new WooClient();

		wooClient.addStore("test", {
			store_url: process.env.STORE_URL!,
			wc_key: process.env.WC_KEY!,
			wc_secret: process.env.WC_SECRET!,
			wp_username: process.env.WP_USERNAME!,
			wp_app_pass: process.env.WP_APP_PASSWORD!,
		});

		store = wooClient.selectStore("test");
	});

	it("should update existing product", async () => {
		const timestamp = Date.now();
		const sku = `TEST-UPDATE-${timestamp}`;

		// Create
		const createResult = await store.createProducts([
			{
				name: "Original product",
				sku,
				price: 1000,
				description: "Original description",
			},
		]);

		expect(createResult.create).toHaveLength(1);

		const productId = createResult.create[0].id;

		expect(productId).toBeDefined();

		// Update
		const updateResult = await store.updateProducts([
			{
				id: productId,
				name: "Updated product",
				price: 2500,
				description: "Updated description",
			},
		]);

		expect(updateResult.update).toHaveLength(1);

		// WooCommerce may need a moment
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Fetch updated product
		const response = await fetch(
			`${process.env.STORE_URL}/wp-json/wc/v3/products/${productId}`,
			{
				headers: {
					Authorization:
						"Basic " +
						Buffer.from(
							`${process.env.WC_KEY}:${process.env.WC_SECRET}`,
						).toString("base64"),
				},
			},
		);

		expect(response.ok).toBe(true);

		const product = await response.json();

		expect(product.name).toBe("Updated product");
		expect(product.description).toContain("Updated description");
		expect(product.regular_price).toBe("2500");

		// Cleanup
		await fetch(
			`${process.env.STORE_URL}/wp-json/wc/v3/products/${productId}?force=true`,
			{
				method: "DELETE",
				headers: {
					Authorization:
						"Basic " +
						Buffer.from(
							`${process.env.WC_KEY}:${process.env.WC_SECRET}`,
						).toString("base64"),
				},
			},
		);
	}, 60000);
});
