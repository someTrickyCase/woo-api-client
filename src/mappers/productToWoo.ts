import { DestributedProductType, ProductType } from "../types/types";

export default async function mapProduct(
	product: Partial<ProductType>,
	uploadImages: (paths: string[]) => Promise<{ id: number }[]>,
): Promise<Partial<DestributedProductType>> {
	let allImageIds: { id: number }[] = [];
	let featuredImageId: number | null = null;

	if (product.featuredImage) {
		try {
			const featuredImages = await uploadImages([product.featuredImage]);
			if (featuredImages.length > 0) {
				featuredImageId = featuredImages[0].id;
				allImageIds.push(featuredImages[0]);
			}
		} catch (error) {
			console.error("Failed to upload featured image:", error);
		}
	}

	if (product.images && product.images.length > 0) {
		const galleryImagesToUpload =
			product.featuredImage ?
				product.images.filter((img) => img !== product.featuredImage)
			:	product.images;

		if (galleryImagesToUpload.length > 0) {
			try {
				const galleryImages = await uploadImages(galleryImagesToUpload);
				allImageIds = [...allImageIds, ...galleryImages];
			} catch (error) {
				console.error("Failed to upload gallery images:", error);
			}
		}
	}

	const productData: Partial<DestributedProductType> = {
		...(product.id && {
			id: product.id,
		}),
		...(product.name && { name: product.name }),
		...(product.sku && { sku: product.sku }),

		...(product.price !== undefined && {
			regular_price: product.price.toString(),
		}),

		...(product.description && {
			description: product.description,
		}),

		...(product.shortDescription && {
			short_description: product.shortDescription,
		}),

		...(product.attributes && {
			attributes: product.attributes,
		}),

		...(product.categories && {
			categories: product.categories,
		}),
	};

	if (allImageIds.length > 0) {
		if (featuredImageId) {
			productData.images = [
				{ id: featuredImageId },
				...allImageIds.filter((img) => img.id !== featuredImageId),
			];
		} else {
			productData.images = allImageIds;
		}
	}

	return productData;
}
