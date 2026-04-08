export type ProductStatus = "draft" | "active" | "archived";
export type CategoryStatus = string;
export type OrderRecord = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  product_name: string | null;
  product_sku: string | null;
  created_at: string | null;
  email: string | null;
};

export type ProductMeta = {
  title?: string;
  description?: string;
  keywords?: string[];
};

export type ProductDescriptionJson = {
  type: "doc";
  content?: unknown[];
};

export type ProductRecord = {
  id: string;
  model: string | null;
  name: string;
  description: ProductDescriptionJson | null;
  meta: ProductMeta | null;
  slug: string;
  tags: string[] | null;
  sku: string | null;
  upc: string | null;
  mpn: string | null;
  stock: number | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  price: number;
  quantity: number | null;
  main_image: string | null;
  /** Sanity LQIP / tiny data URL for `next/image` blur placeholder when available. */
  main_image_blur_data_url?: string | null;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  manufacturer: string | null;
  related_products: string[] | null;
  status: ProductStatus;
  categories: string[] | null;
  /**
   * Leaf category: main category only, OR subcategory when `parent_category_id` is set.
   * Matches numeric `categories.category_id`.
   */
  category_id: number | null;
  /** When product is in a subcategory: main category’s numeric `categories.category_id`. Otherwise null. */
  parent_category_id: number | null;
  promotions: boolean;
  bestsellers: boolean;
  discounts: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  category_id: number;
  parent_id: number;
  description: unknown | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  sort_order: number;
  status: CategoryStatus;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWriteInput = Omit<ProductRecord, "id" | "created_at" | "updated_at">;
