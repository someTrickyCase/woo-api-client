import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";
import { CategoryType } from "../../types/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function fetchAllPages(baseUrl: string, authHeader: string): Promise<any[]> {
	let allResults: any[] = [];
	let page = 1;
	let totalPages = 1;

	while (page <= totalPages) {
		const response = await fetch(`${baseUrl}?page=${page}&per_page=100`, {
			headers: {
				Authorization: authHeader,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		allResults.push(...data);

		const totalPagesHeader = response.headers.get("X-WP-TotalPages");
		totalPages = totalPagesHeader ? parseInt(totalPagesHeader) : 1;

		page++;
	}

	return allResults;
}

describe("get categories e2e", () => {
	let store: Store;
	let directFetchedCategories: CategoryType[];

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

		const authHeader = "Basic " + Buffer.from(`${wc_key}:${wc_secret}`).toString("base64");

		directFetchedCategories = await fetchAllPages(
			`${store_url}/wp-json/wc/v3/products/categories`,
			authHeader
		);
	});

	it("should return the same categories as direct API call", async () => {
		const categories = await store.getCategories();
		expect(categories.length).toEqual(directFetchedCategories.length);

		directFetchedCategories.forEach((expectedCategory) => {
			const foundCategory = categories.find((cat: CategoryType) => cat.id === expectedCategory.id);
			expect(foundCategory).toBeDefined();
			expect(foundCategory.name).toEqual(expectedCategory.name);
			expect(foundCategory.slug).toEqual(expectedCategory.slug);
		});
	});
});
