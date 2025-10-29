import Connection from "../services/Connection";

global.fetch = jest.fn();

describe("Connection", () => {
	let connection: Connection;
	const mockStoreUrl = "https://test-store.com";
	const mockAuth = { key: "test_key", secret: "test_secret" };

	beforeEach(() => {
		connection = new Connection(mockStoreUrl, mockAuth);
		jest.clearAllMocks();
	});

	describe("post", () => {
		it("should make POST request with correct headers and body", async () => {
			const mockResponse = { id: 1, name: "test" };
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const endpoint = "/test-endpoint";
			const body = JSON.stringify({ test: "data" });
			const result = await connection.post(endpoint, body);

			expect(fetch).toHaveBeenCalledWith(`${mockStoreUrl}${endpoint}`, {
				method: "POST",
				headers: {
					Authorization: "Basic dGVzdF9rZXk6dGVzdF9zZWNyZXQ=",
					"content-type": "application/json",
				},
				body,
			});
			expect(result).toEqual(mockResponse);
		});

		it("should retry on network failure", async () => {
			const mockResponse = { id: 1 };
			let callCount = 0;

			(fetch as jest.Mock).mockImplementation(() => {
				callCount++;
				if (callCount < 3) {
					throw new Error("Network error");
				}
				return Promise.resolve({
					ok: true,
					json: async () => mockResponse,
				});
			});

			const result = await connection.post("/test", "{}");

			expect(callCount).toBe(3);
			expect(result).toEqual(mockResponse);
		});

		it("should not retry on 4xx errors", async () => {
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: async () => "Bad Request",
			});

			await expect(connection.post("/test", "{}")).rejects.toThrow("HTTP 400: Bad Request");

			expect(fetch).toHaveBeenCalledTimes(1); // Only one attempt for 4xx
		});
	});

	describe("get", () => {
		it("should make GET request with correct headers", async () => {
			const mockResponse = { data: "test" };
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const endpoint = "/products";
			const result = await connection.get(endpoint);

			expect(fetch).toHaveBeenCalledWith(`${mockStoreUrl}${endpoint}`, {
				method: "GET",
				headers: {
					Authorization: "Basic dGVzdF9rZXk6dGVzdF9zZWNyZXQ=",
				},
			});
			expect(result).toEqual(mockResponse);
		});
	});
});
