import Store from "./store";
import { CredentialsType } from "./types/types";

export default class WooClient {
	stores: Map<string, CredentialsType> = new Map();

	addStore(storeKey: string, credentials: CredentialsType) {
		this.stores.set(storeKey, credentials);
	}

	selectStore(storeKey: string) {
		const credentials = this.stores.get(storeKey);
		if (!credentials) throw new Error("Store not found");
		return new Store(credentials);
	}

	selectAllStores(): Store[] {
		const allStores: Store[] = [];
		Array.from(this.stores.values()).map((credentials) => {
			allStores.push(new Store(credentials));
		});
		return allStores;
	}

	removeStore(storeKey: string) {
		this.stores.delete(storeKey);
	}

	removeAllStores() {
		this.stores.clear();
	}
}
