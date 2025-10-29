import * as dotenv from "dotenv";
import path from "path";
import Store from "../../store";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

describe("upload images e2e", () => {
	let store: Store;

	beforeAll(() => {
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
	});

	it("should upload real images", async () => {
		const imagePaths = [
			path.resolve(process.cwd(), "test-images/image1.png"),
			path.resolve(process.cwd(), "test-images/image2.png"),
		];

		const uploadImageResult = await store.uploadImages(imagePaths);

		expect(Array.isArray(uploadImageResult)).toBe(true);
		expect(uploadImageResult.length).toBe(2);

		uploadImageResult.forEach((result) => {
			expect(result.id).toBeDefined();
			expect(typeof result.id).toBe("number");
		});
	});

	it("should handle non-existent images", async () => {
		const nonExistentPaths = ["/non/existent/image.jpg"];

		await expect(store.uploadImages(nonExistentPaths)).rejects.toThrow();
	});
});
