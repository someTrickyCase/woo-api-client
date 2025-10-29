import WooClient from "../../index";
import Store from "../../store"; // We'll create this later
import { CredentialsType } from "../../types/types";

describe("WooClient", () => {
	let client: WooClient;

	beforeEach(() => {
		client = new WooClient();
	});

	describe("Store Management", () => {
		const testCredentials: CredentialsType = {
			store_url: "https://store1.com",
			wc_key: "ck_test",
			wc_secret: "cs_test",
		};

		it("should add store with valid credentials", () => {
			client.addStore("main", testCredentials);
			expect(client.stores.has("main")).toBe(true);
		});

		it("should remove store by key", () => {
			client.addStore("main", testCredentials);
			client.removeStore("main");
			expect(client.stores.has("main")).toBe(false);
		});

		it("should return Store instance for selected store", () => {
			client.addStore("main", testCredentials);
			const store = client.selectStore("main");

			expect(store).toBeInstanceOf(Store);
		});

		it("should return array of all stores credentials", () => {
			client.addStore("main", testCredentials);
			client.addStore("backup", {
				store_url: "https://store2.com",
				wc_key: "ck_test2",
				wc_secret: "cs_test2",
			});

			const allStores = client.selectAllStores();

			expect(Array.isArray(allStores)).toBe(true);
			expect(allStores).toHaveLength(2);
			allStores.map((store) => {
				expect(store).toBeInstanceOf(Store);
			});
		});

		it("should remove all stores", () => {
			client.addStore("main", testCredentials);
			client.addStore("backup", testCredentials);

			client.removeAllStores();

			expect(client.stores.size).toEqual(0);
			expect(() => client.selectStore("main")).toThrow("Store not found");
		});
	});
});
