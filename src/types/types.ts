export type CredentialsType = {
	store_url: string;
	wc_key: string;
	wc_secret: string;
	wp_username?: string;
	wp_app_pass?: string;
};

export type CreateAttributeType = {
	name: string;
	slug?: string;
	type?: "select";
	order_by?: "menu_order" | "name" | "name_num" | "id";
	has_archives?: boolean;
};

export type CategoryType = {
	id: number;
	name: string;
	slug: string;
	count: number;
	children: CategoryType[];
	parent: CategoryType;
};

export type CreateCategoryType = {
	name: string;
	slug?: string;
	parent?: number;
	description?: string;
};

export type TagType = {
	id: number;
	name?: string;
	slug?: string;
};

export type CreateTagType = {
	name: string;
	slug?: string;
};

export type ManufacturerType = {
	id: number;
	name: string;
	slug: string;
};

export type ProductType = {
	id?: number;
	name: string;
	sku: string;
	price: number;
	description?: string;
	shortDescription?: string;
	attributes?: Array<{
		id: number;
		options: string[];
	}>;
	categories?: Array<{
		id: number;
	}>;
	featuredImage?: string;
	images?: string[];
	tags?: TagType[];
};

export type UpdateProductType = Partial<ProductType> & {
	id: number;
};

export type DestributedProductType = {
	images?: { id: number }[];
	name: string;
	sku: string;
	regular_price: string;
	description?: string;
	short_description?: string;
	categories?: { id: number }[];
	attribures?: { id: number }[];
};
