export type ProductStatus = "draft" | "active" | "archived";
export type CategoryStatus = string;

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
  image1: string | null;
  image2: string | null;
  image3: string | null;
  manufacturer: string | null;
  related_products: string[] | null;
  status: ProductStatus;
  categories: string[] | null;
  /** CMS / bulk: FK to public.categories.id — parent category (Excel Cat. 2). */
  category_id: string | null;
  /** CMS / bulk: FK to public.categories.id — child category under parent (Excel Cat. 1). */
  subcategory_id: string | null;
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
