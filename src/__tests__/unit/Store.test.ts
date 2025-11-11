import Store from "../../store";
import Connection from "../../services/Connection";

jest.mock("../../services/Connection");

describe("Store", () => {
	let store: Store;
	let mockGet: jest.Mock;
	let mockPost: jest.Mock;

	const mockCredentials = {
		store_url: "https://test-store.com",
		wp_username: "test_user",
		wp_app_pass: "test_pass",
		wc_key: "ck_test",
		wc_secret: "cs_test",
	};

	beforeEach(() => {
		mockGet = jest.fn();
		mockPost = jest.fn();

		(Connection as jest.MockedClass<typeof Connection>).mockImplementation(
			() =>
				({
					get: mockGet,
					post: mockPost,
				} as any)
		);

		store = new Store(mockCredentials);
		jest.clearAllMocks();
	});

	describe("getManufacturers", () => {
		const mockAttributes = [
			{ id: 1, name: "Color", slug: "pa_color" },
			{ id: 2, name: "Производитель", slug: "pa_proizvoditel" },
			{ id: 3, name: "Size", slug: "pa_size" },
		];

		const mockManufacturers = [
			{ id: 1, name: "Samsung", slug: "samsung", count: 10 },
			{ id: 2, name: "Apple", slug: "apple", count: 5 },
		];

		it("should return manufacturers from cache on subsequent calls", async () => {
			mockGet.mockResolvedValueOnce(mockAttributes).mockResolvedValueOnce(mockManufacturers);

			const firstCall = await store.getManufacturers();
			const secondCall = await store.getManufacturers();

			expect(firstCall).toBe(mockManufacturers);
			expect(secondCall).toBe(mockManufacturers);
			expect(mockGet).toHaveBeenCalledTimes(2);
		});

		it("should throw error when manufacturer attribute not found", async () => {
			mockGet.mockResolvedValueOnce([{ id: 1, name: "Color", slug: "pa_color" }]);

			await expect(store.getManufacturers()).rejects.toThrow("Manufacturer attribute not found");
		});

		it("should find manufacturer attribute by correct slug and call correct endpoint", async () => {
			mockGet.mockResolvedValueOnce(mockAttributes).mockResolvedValueOnce(mockManufacturers);

			const result = await store.getManufacturers();

			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products/attributes/2/terms");
			expect(result).toEqual(mockManufacturers);
		});

		it("should have separate cache for different Store instances", async () => {
			const store2 = new Store(mockCredentials);
			mockGet
				.mockResolvedValueOnce([...mockAttributes])
				.mockResolvedValueOnce([...mockManufacturers])
				.mockResolvedValueOnce([...mockAttributes])
				.mockResolvedValueOnce([...mockManufacturers]);

			await store.getManufacturers();
			await store2.getManufacturers();

			expect(mockGet).toHaveBeenCalledTimes(4);
		});
	});

	describe("getCategories", () => {
		it("should call connection with correct endpoint", async () => {
			const mockCategories = [{ id: 1, name: "Electronics" }];
			mockGet.mockResolvedValueOnce(mockCategories);

			const result = await store.getCategories();

			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products/categories");
			expect(result).toEqual(mockCategories);
		});
	});

	describe("getAllProducts", () => {
		it("should call connection with correct endpoint", async () => {
			const mockProduct = [{ id: 1, name: "product-1" }];
			mockGet.mockResolvedValueOnce(mockProduct);

			const result = await store.getAllProducts();

			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products");
			expect(result).toEqual(mockProduct);
		});
	});

	describe("getAttributes", () => {
		it("should call connection with correct endpoint", async () => {
			const mockAttributes = [{ id: 1, name: "Color" }];
			mockGet.mockResolvedValueOnce(mockAttributes);

			const result = await store.getAttributes();

			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products/attributes/");
			expect(result).toEqual(mockAttributes);
		});
	});

	describe("uploadImages", () => {
		it("should upload multiple images", async () => {
			const mockImageResponse1 = { id: 123 };
			const mockImageResponse2 = { id: 456 };
			mockPost.mockResolvedValueOnce(mockImageResponse1).mockResolvedValueOnce(mockImageResponse2);

			const imagePaths = ["/path/to/image1.jpg", "/path/to/image2.jpg"];

			const fs = require("fs");
			jest.spyOn(fs, "existsSync").mockReturnValue(true);
			jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("test"));

			const result = await store.uploadImages(imagePaths);

			expect(mockPost).toHaveBeenCalledTimes(2);
			expect(result).toEqual([{ id: 123 }, { id: 456 }]);
		});

		it("should throw error when image file not found", async () => {
			const fs = require("fs");
			jest.spyOn(fs, "existsSync").mockReturnValue(false);

			await expect(store.uploadImages(["/nonexistent/image.jpg"])).rejects.toThrow(
				"File not found: /nonexistent/image.jpg"
			);
		});
	});

	describe("getProductIdsBySkus", () => {
		let store: Store;
		let mockGet: jest.Mock;

		const mockCredentials = {
			store_url: "https://test-store.com",
			wc_key: "ck_test",
			wc_secret: "cs_test",
		};

		beforeEach(() => {
			mockGet = jest.fn();
			(Connection as jest.MockedClass<typeof Connection>).mockImplementation(
				() =>
					({
						get: mockGet,
						post: jest.fn(),
					} as any)
			);

			store = new Store(mockCredentials);
			jest.clearAllMocks();
		});

		it("should return product IDs for multiple SKUs in single request", async () => {
			const mockProducts = [
				{ id: 101, sku: "SKU001", name: "Product 1" },
				{ id: 102, sku: "SKU002", name: "Product 2" },
				{ id: 103, sku: "SKU003", name: "Product 3" },
			];

			mockGet.mockResolvedValueOnce(mockProducts);

			const skus = ["SKU001", "SKU002", "SKU003"];
			const result = await store.getProductIdsBySkus(skus);

			// Single request with comma-separated SKUs
			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products?sku=SKU001,SKU002,SKU003");
			expect(result).toEqual([
				{ sku: "SKU001", id: 101 },
				{ sku: "SKU002", id: 102 },
				{ sku: "SKU003", id: 103 },
			]);
		});

		it("should handle missing SKUs in response", async () => {
			const mockProducts = [
				{ id: 101, sku: "SKU001", name: "Product 1" },
				// SKU002 and SKU003 are missing in response
			];

			mockGet.mockResolvedValueOnce(mockProducts);

			const skus = ["SKU001", "SKU002", "SKU003"];
			const result = await store.getProductIdsBySkus(skus);

			expect(result).toEqual([
				{ sku: "SKU001", id: 101 },
				{ sku: "SKU002", id: null },
				{ sku: "SKU003", id: null },
			]);
		});

		it("should handle empty skus array", async () => {
			const result = await store.getProductIdsBySkus([]);

			expect(mockGet).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});

		it("should handle large number of SKUs with pagination", async () => {
			// If we have more SKUs than API limit, might need multiple requests
			const manySkus = Array.from(
				{ length: 150 },
				(_, i) => `SKU${String(i + 1).padStart(3, "0")}`
			);

			const mockProducts = [{ id: 1, sku: "SKU001", name: "Product 1" }];

			mockGet.mockResolvedValueOnce(mockProducts);

			const result = await store.getProductIdsBySkus(manySkus);

			// Should make request with all SKUs comma-separated
			expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/wp-json/wc/v3/products?sku="));
		});

		it("should URL encode SKUs with special characters", async () => {
			const mockProducts = [{ id: 101, sku: "SKU/001", name: "Product 1" }];

			mockGet.mockResolvedValueOnce(mockProducts);

			const skus = ["SKU/001", "SKU 002"];
			await store.getProductIdsBySkus(skus);

			expect(mockGet).toHaveBeenCalledWith("/wp-json/wc/v3/products?sku=SKU%2F001,SKU%20002");
		});
	});

	describe("updatePrices", () => {
		it("should update prices for multiple products via batch request", async () => {
			const priceUpdates = {
				SKU001: 1000,
				SKU002: 2000,
				SKU003: 3000,
			};

			const mockProductIds = [
				{ sku: "SKU001", id: 101 },
				{ sku: "SKU002", id: 102 },
				{ sku: "SKU003", id: 103 },
			];

			const mockBatchResponse = {
				update: [
					{ id: 101, price: 1000 },
					{ id: 102, price: 2000 },
					{ id: 103, price: 3000 },
				],
			};

			mockGet.mockResolvedValueOnce(mockProductIds);
			mockPost.mockResolvedValueOnce(mockBatchResponse);

			const result = await store.updatePrices(priceUpdates);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					update: [
						{ id: 101, regular_price: "1000" },
						{ id: 102, regular_price: "2000" },
						{ id: 103, regular_price: "3000" },
					],
				})
			);

			expect(result).toEqual(mockBatchResponse);
		});

		it("should skip products where SKU not found", async () => {
			const priceUpdates = {
				SKU001: 1000,
				SKU002: 2000, // This SKU not found
			};

			const mockProductIds = [
				{ sku: "SKU001", id: 101 },
				{ sku: "SKU002", id: null }, // SKU002 not found
			];

			mockGet.mockResolvedValueOnce(mockProductIds);
			mockPost.mockResolvedValueOnce({ update: [{ id: 101, price: 1000 }] });

			await store.updatePrices(priceUpdates);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					update: [
						{ id: 101, regular_price: "1000" },
						// SKU002 skipped
					],
				})
			);
		});
	});

	describe("createProducts", () => {
		it("should create products with descriptions", async () => {
			const productsData = [
				{
					name: "Product 1",
					sku: "SKU001",
					price: 1000,
					description: "Full product description",
					shortDescription: "Short description",
				},
			];

			const mockBatchResponse = {
				create: [{ id: 101, name: "Product 1", sku: "SKU001" }],
			};

			mockPost.mockResolvedValueOnce(mockBatchResponse);

			const result = await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product 1",
							sku: "SKU001",
							regular_price: "1000",
							description: "Full product description",
							short_description: "Short description",
						},
					],
				})
			);
			expect(result).toEqual(mockBatchResponse);
		});

		it("should split large number of products into batches", async () => {
			const productsData = Array.from({ length: 75 }, (_, i) => ({
				name: `Product ${i + 1}`,
				sku: `SKU${i + 1}`,
				price: 100 + i,
			}));

			const mockBatchResponse1 = {
				create: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` })),
			};

			const mockBatchResponse2 = {
				create: Array.from({ length: 25 }, (_, i) => ({ id: i + 51, name: `Product ${i + 51}` })),
			};

			mockPost.mockResolvedValueOnce(mockBatchResponse1).mockResolvedValueOnce(mockBatchResponse2);

			const result = await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledTimes(2);

			expect(mockPost).toHaveBeenNthCalledWith(
				1,
				"/wp-json/wc/v3/products/batch",
				expect.stringContaining('"create":')
			);

			expect(mockPost).toHaveBeenNthCalledWith(
				2,
				"/wp-json/wc/v3/products/batch",
				expect.stringContaining('"create":')
			);

			expect(result.create).toHaveLength(75);
			expect(result.create[0]).toEqual({ id: 1, name: "Product 1" });
			expect(result.create[49]).toEqual({ id: 50, name: "Product 50" });
			expect(result.create[50]).toEqual({ id: 51, name: "Product 51" });
		});

		it("should handle batch failures gracefully", async () => {
			const productsData = Array.from({ length: 60 }, (_, i) => ({
				name: `Product ${i + 1}`,
				sku: `SKU${i + 1}`,
				price: 100 + i,
			}));

			const mockBatchResponse1 = {
				create: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}` })),
			};

			const batchError = new Error("API Error");
			mockPost.mockResolvedValueOnce(mockBatchResponse1).mockRejectedValueOnce(batchError);

			const result = await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledTimes(2);
			expect(result.create).toHaveLength(50);
			expect(result.errors).toBeDefined();
		});

		it("should return empty result for empty input", async () => {
			const result = await store.createProducts([]);

			expect(mockPost).not.toHaveBeenCalled();
			expect(result).toEqual({ create: [] });
		});

		it("should handle products with partial descriptions", async () => {
			const productsData = [
				{
					name: "Product 1",
					sku: "SKU001",
					price: 1000,
					description: "Only full description",
					// No shortDescription
				},
				{
					name: "Product 2",
					sku: "SKU002",
					price: 2000,
					shortDescription: "Only short description",
					// No description
				},
			];

			mockPost.mockResolvedValueOnce({ create: [{ id: 101 }, { id: 102 }] });

			await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product 1",
							sku: "SKU001",
							regular_price: "1000",
							description: "Only full description",
							// No short_description
						},
						{
							name: "Product 2",
							sku: "SKU002",
							regular_price: "2000",
							short_description: "Only short description",
							// No description
						},
					],
				})
			);
		});

		it("should handle products with featured image", async () => {
			const productsData = [
				{
					name: "Product with Featured",
					sku: "SKU-FEATURED",
					price: 1500,
					featuredImage: "/path/to/featured.jpg",
					images: ["/path/to/gallery1.jpg", "/path/to/gallery2.jpg"],
				},
			];

			const mockBatchResponse = {
				create: [{ id: 101, name: "Product with Featured", sku: "SKU-FEATURED" }],
			};

			// Mock uploadImages method directly
			const uploadImagesMock = jest
				.spyOn(store, "uploadImages")
				.mockResolvedValueOnce([{ id: 201 }]) // featured image
				.mockResolvedValueOnce([{ id: 202 }, { id: 203 }]); // gallery images

			mockPost.mockResolvedValueOnce(mockBatchResponse);

			await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product with Featured",
							sku: "SKU-FEATURED",
							regular_price: "1500",
							images: [
								{ id: 201 }, // featured image first
								{ id: 202 }, // then gallery images
								{ id: 203 },
							],
						},
					],
				})
			);

			// Verify uploadImages was called correctly
			expect(uploadImagesMock).toHaveBeenCalledTimes(2);
			expect(uploadImagesMock).toHaveBeenNthCalledWith(1, ["/path/to/featured.jpg"]);
			expect(uploadImagesMock).toHaveBeenNthCalledWith(2, [
				"/path/to/gallery1.jpg",
				"/path/to/gallery2.jpg",
			]);

			uploadImagesMock.mockRestore();
		});

		it("should handle products with only featured image", async () => {
			const productsData = [
				{
					name: "Product Featured Only",
					sku: "SKU-FEATURED-ONLY",
					price: 1200,
					featuredImage: "/path/to/featured.jpg",
					// No gallery images
				},
			];

			const mockBatchResponse = {
				create: [{ id: 101, name: "Product Featured Only", sku: "SKU-FEATURED-ONLY" }],
			};

			// Mock uploadImages for featured image only
			const uploadImagesMock = jest
				.spyOn(store, "uploadImages")
				.mockResolvedValueOnce([{ id: 301 }]);

			mockPost.mockResolvedValueOnce(mockBatchResponse);

			await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product Featured Only",
							sku: "SKU-FEATURED-ONLY",
							regular_price: "1200",
							images: [
								{ id: 301 }, // only featured image
							],
						},
					],
				})
			);

			expect(uploadImagesMock).toHaveBeenCalledWith(["/path/to/featured.jpg"]);
			uploadImagesMock.mockRestore();
		});

		it("should handle products with only gallery images", async () => {
			const productsData = [
				{
					name: "Product Gallery Only",
					sku: "SKU-GALLERY-ONLY",
					price: 1800,
					images: ["/path/to/gallery1.jpg", "/path/to/gallery2.jpg"],
					// No featured image
				},
			];

			const mockBatchResponse = {
				create: [{ id: 101, name: "Product Gallery Only", sku: "SKU-GALLERY-ONLY" }],
			};

			// Mock uploadImages for gallery images
			const uploadImagesMock = jest
				.spyOn(store, "uploadImages")
				.mockResolvedValueOnce([{ id: 401 }, { id: 402 }]);

			mockPost.mockResolvedValueOnce(mockBatchResponse);

			await store.createProducts(productsData);

			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product Gallery Only",
							sku: "SKU-GALLERY-ONLY",
							regular_price: "1800",
							images: [
								{ id: 401 }, // gallery images in natural order
								{ id: 402 },
							],
						},
					],
				})
			);

			expect(uploadImagesMock).toHaveBeenCalledWith([
				"/path/to/gallery1.jpg",
				"/path/to/gallery2.jpg",
			]);
			uploadImagesMock.mockRestore();
		});

		it("should handle image upload failures gracefully", async () => {
			const productsData = [
				{
					name: "Product with Failed Images",
					sku: "SKU-FAILED-IMAGES",
					price: 999,
					featuredImage: "/path/to/featured.jpg",
					images: ["/path/to/gallery.jpg"],
				},
			];

			const mockBatchResponse = {
				create: [{ id: 101, name: "Product with Failed Images", sku: "SKU-FAILED-IMAGES" }],
			};

			// Mock uploadImages to fail for featured but work for gallery
			const uploadImagesMock = jest
				.spyOn(store, "uploadImages")
				.mockRejectedValueOnce(new Error("Upload failed")) // featured fails
				.mockResolvedValueOnce([{ id: 501 }]); // gallery succeeds

			mockPost.mockResolvedValueOnce(mockBatchResponse);

			await store.createProducts(productsData);

			// Should still create product but only with gallery image
			expect(mockPost).toHaveBeenCalledWith(
				"/wp-json/wc/v3/products/batch",
				JSON.stringify({
					create: [
						{
							name: "Product with Failed Images",
							sku: "SKU-FAILED-IMAGES",
							regular_price: "999",
							images: [
								{ id: 501 }, // only gallery image (featured failed)
							],
						},
					],
				})
			);

			uploadImagesMock.mockRestore();
		});
	});
});
