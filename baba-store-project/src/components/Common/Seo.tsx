import type { Metadata } from "next";
import Head from "next/head";

export type SeoSchema = Record<string, unknown> | Array<Record<string, unknown>>;

export type SeoGenerateMetadataArgs = {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  ogType?: string;
  keywords?: string;
};

export function seoGenerateMetadata({
  title,
  description,
  url,
  imageUrl,
  ogType = "website",
  keywords,
}: SeoGenerateMetadataArgs): Metadata {
  const metaImageUrl = imageUrl ?? "/images/logo.webp";
  // Next.js validates `Metadata.openGraph.type` against a strict allowlist.
  // If we pass an unsupported value (like `product`), runtime throws.
  const nextOgType = ogType === "product" ? "website" : ogType;

  return {
    alternates: {
      canonical: url,
      languages: {
        // Keep language list aligned with `app/layout.tsx` (ka-GE).
        "ka-GE": url,
        "x-default": url,
      },
    },
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: metaImageUrl }],
      url,
      type: nextOgType as any,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [metaImageUrl],
    },
    keywords,
  };
}

type SeoComponentProps = {
  // When provided, component will also emit meta tags (Head).
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  ogType?: string;
  keywords?: string;
  // Schema.org JSON-LD.
  schema?: SeoSchema;
};

export default function Seo({
  title,
  description,
  url,
  imageUrl,
  ogType,
  keywords,
  schema,
}: SeoComponentProps) {
  const metaImageUrl = imageUrl ?? "/images/logo.webp";
  const shouldEmitMeta = Boolean(title || description || url || imageUrl || keywords);

  return (
    <Head>
      {shouldEmitMeta ? (
        <>
          {title ? <title>{title}</title> : null}
          {url ? <link rel="canonical" href={url} /> : null}
          {description ? <meta name="description" content={description} /> : null}
          {keywords ? <meta name="keywords" content={keywords} /> : null}

          {title ? <meta property="og:title" content={title} /> : null}
          {description ? <meta property="og:description" content={description} /> : null}
          {url ? <meta property="og:url" content={url} /> : null}
          {ogType ? <meta property="og:type" content={ogType} /> : null}
          {metaImageUrl ? <meta property="og:image" content={metaImageUrl} /> : null}

          {imageUrl ? <meta name="twitter:image" content={metaImageUrl} /> : null}
          <meta name="twitter:card" content="summary_large_image" />
        </>
      ) : null}

      {schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ) : null}
    </Head>
  );
}
