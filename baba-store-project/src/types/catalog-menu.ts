export type CatalogCategoryChild = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogCategoryParent = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children: CatalogCategoryChild[];
};
