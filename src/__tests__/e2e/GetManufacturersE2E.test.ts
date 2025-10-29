import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

describe("Store.getManufacturers (e2e)", () => {
	let store: Store;
	let directFetchedManufacturers: any[];

	beforeAll(async () => {
		const wp_username = process.env.WP_USERNAME || "";
		const wp_app_pass = process.env.WP_APP_PASSWORD || "";
		const wc_key = process.env.WC_KEY || "";
		const wc_secret = process.env.WC_SECRET || "";
		const store_url = process.env.STORE_URL || "";

		const credentials = {
			wp_app_pass,
			wp_username,
			wc_key,
			wc_secret,
			store_url,
		};
		store = new Store(credentials);

		const attributesResponse = await fetch(`${store_url}/wp-json/wc/v3/products/attributes`, {
			headers: {
				Authorization: "Basic " + Buffer.from(`${wc_key}:${wc_secret}`).toString("base64"),
			},
		});
		const attributes = await attributesResponse.json();

		const manufacturerAttribute = attributes.find((attr: any) => attr.slug === "pa_proizvoditel");

		if (!manufacturerAttribute) {
			throw new Error("Manufacturer attribute not found in direct fetch");
		}

		const manufacturersResponse = await fetch(
			`${store_url}/wp-json/wc/v3/products/attributes/${manufacturerAttribute.id}/terms`,
			{
				headers: {
					Authorization: "Basic " + Buffer.from(`${wc_key}:${wc_secret}`).toString("base64"),
				},
			}
		);
		directFetchedManufacturers = await manufacturersResponse.json();
	});

	it("should return the same manufacturers as direct API call", async () => {
		const manufacturers = await store.getManufacturers();
		expect(manufacturers).toEqual(directFetchedManufacturers);
	});

	it("should cache manufacturers for subsequent calls", async () => {
		const firstCall = await store.getManufacturers();
		const secondCall = await store.getManufacturers();

		expect(firstCall).toBe(secondCall);
	});
});
