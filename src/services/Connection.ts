function withRetry(maxRetries: number = 3, delay: number = 1000) {
	return function <T extends (...args: any[]) => Promise<any>>(
		target: any,
		propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<T>
	) {
		const originalMethod = descriptor.value!;

		descriptor.value = async function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
			let lastError: Error;

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					return await originalMethod.apply(this, args);
				} catch (error: unknown) {
					const err = error as Error;
					lastError = err;

					if (err.message?.includes("HTTP 4")) {
						throw err;
					}

					console.log(`Attempt ${attempt} failed: ${err.message}. Retrying...`);

					if (attempt < maxRetries) {
						await new Promise((resolve) => setTimeout(resolve, delay * attempt));
					}
				}
			}

			throw lastError!;
		} as T;

		return descriptor;
	};
}

export default class Connection {
	private storeUrl: string;
	private auth: { key?: string; secret?: string };

	constructor(storeUrl: string, auth: { key?: string; secret?: string }) {
		this.auth = auth;
		this.storeUrl = storeUrl;
	}

	@withRetry(3, 1000)
	async post(endpoint: string, body: string | FormData) {
		const headers: HeadersInit = {
			Authorization: `Basic ${Buffer.from(this.auth.key + ":" + this.auth.secret).toString(
				"base64"
			)}`,
		};
		if (typeof body === "string") headers["content-type"] = "application/json";

		const response = await fetch(`${this.storeUrl + endpoint}`, {
			headers,
			method: "POST",
			body,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		return await response.json();
	}

	@withRetry(3, 1000)
	async get(endpoint: string) {
		const response = await fetch(`${this.storeUrl + endpoint}`, {
			headers: {
				Authorization: `Basic ${Buffer.from(this.auth.key + ":" + this.auth.secret).toString(
					"base64"
				)}`,
			},
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		return await response.json();
	}
}
