import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

// Функция для получения всех данных через пагинацию
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

		// Получаем общее количество страниц из заголовков
		const totalPagesHeader = response.headers.get("X-WP-TotalPages");
		totalPages = totalPagesHeader ? parseInt(totalPagesHeader) : 1;

		page++;
	}

	return allResults;
}

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

		const authHeader = "Basic " + Buffer.from(`${wc_key}:${wc_secret}`).toString("base64");

		// Получаем все атрибуты с пагинацией
		const attributes = await fetchAllPages(
			`${store_url}/wp-json/wc/v3/products/attributes`,
			authHeader
		);

		const manufacturerAttribute = attributes.find((attr: any) => attr.slug === "pa_proizvoditel");

		if (!manufacturerAttribute) {
			throw new Error("Manufacturer attribute not found in direct fetch");
		}

		// Получаем всех производителей с пагинацией
		directFetchedManufacturers = await fetchAllPages(
			`${store_url}/wp-json/wc/v3/products/attributes/${manufacturerAttribute.id}/terms`,
			authHeader
		);
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
