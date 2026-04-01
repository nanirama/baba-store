# Product Catalogue CMS Setup

## 1) Install dependencies

```bash
npm install
```

## 2) Apply Supabase schema

Run `supabase/cms-schema.sql` inside Supabase SQL Editor.

## 3) Create storage bucket policies

Allow service-role uploads to `product-images` bucket.

## 4) Routes

- `GET /dashboard/products` - list + bulk upload
- `GET /dashboard/products/new` - add product
- `GET /dashboard/products/edit/[id]` - edit product
- `GET /dashboard/categories` - manage categories
- `GET /products/[slug]` - public product page

## 5) Bulk upload format

Use `src/app/dashboard/products/bulk-upload-example.csv` as template.
