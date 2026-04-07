-- Product Catalogue CMS schema
-- Run in Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  model text,
  name text not null,
  description jsonb,
  meta jsonb,
  slug text not null unique,
  tags text[] default '{}',
  sku text,
  upc text,
  mpn text,
  stock integer default 0,
  stock_status text not null default 'InStock' check (stock_status in ('InStock', 'OutOfStock')),
  weight numeric(12,3),
  length numeric(12,3),
  width numeric(12,3),
  height numeric(12,3),
  price numeric(12,2) not null default 0,
  quantity integer default 0,
  main_image text,
  images text[] default '{}',
  manufacturer text,
  related_products uuid[] default '{}',
  status text not null default 'draft' check (status in ('draft','active','archived')),
  categories uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_categories on public.products using gin(categories);

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- If your products table already exists, run this migration block:
alter table public.products drop column if exists dimensions;
alter table public.products add column if not exists weight numeric(12,3);
alter table public.products add column if not exists length numeric(12,3);
alter table public.products add column if not exists width numeric(12,3);
alter table public.products add column if not exists height numeric(12,3);

-- Category links (Cat 1 / Cat 2 from bulk import and CMS)
alter table public.products add column if not exists category_id uuid references public.categories (id) on delete set null;
alter table public.products add column if not exists subcategory_id uuid references public.categories (id) on delete set null;
