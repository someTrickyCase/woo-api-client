import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";
import { ManufacturerType } from "../../types/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

describe("get attributes e2e", () => {
	let store: Store;
	let directFetchedAttributes: ManufacturerType[];

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

		let response = await fetch(`${store_url}/wp-json/wc/v3/products/attributes/`, {
			headers: {
				Authorization: "Basic " + Buffer.from(`${wc_key}:${wc_secret}`).toString("base64"),
			},
		});
		directFetchedAttributes = await response.json();
	});

	it("should return the same attributes as direct API call", async () => {
		const categories = await store.getAttributes();
		expect(categories).toEqual(directFetchedAttributes);
	});
});
