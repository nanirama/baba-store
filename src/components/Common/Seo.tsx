import { Metadata } from "next";
import Head from "next/head";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  imageUrl?: string;
}

export function seoGenerateMetadata({ title, description, url, imageUrl }: SeoProps): Metadata {
  let metaImageurl = "/og-image.png";
  if(imageUrl){
    metaImageurl = imageUrl
  }
  return {
    alternates: {
      canonical: url,
      languages: {
        'en-us': url,
        'x-default': url,
      },
    },
    title,
    description,
    openGraph: {
      title,
      description,
      images: metaImageurl,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: metaImageurl,
    },
  };
}

const Seo = ({ title, description, image, url, imageUrl }: SeoProps) => {
  let metaImageurl = "/og-image.png";
  if(imageUrl){
    metaImageurl = imageUrl
  }
  return(
  <Head>
    <title>{title}</title>
    {url && (
      <>
        <link rel="alternate" hrefLang="en-us" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />
      </>
    )}
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {url && <link rel="canonical" href={url}/>}
    
    {image && <meta property="og:image" content={metaImageurl} />}
    {url && <meta property="og:url" content={url} />}
    <meta name="twitter:card" content="summary_large_image" />
  </Head>
)};

export default Seo;

// Organization Schema JSON-LD data
