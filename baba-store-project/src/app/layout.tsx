import type { Metadata, Viewport } from "next";
import { Montserrat, Oswald } from "next/font/google";
import localFont from "next/font/local"; // ✅ correct
import "./globals.css";

// const oswald = Oswald({
//   subsets: ["latin"],
//   weight: ["700"],
//   display: "swap",
//   variable: "--font-heading",
// });

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-body",
});

const helveticaNeue = localFont({
  src: [
    {
      path: "../../public/fonts/HelveticaNeue-Roman.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-heading", // ✅ FIXED
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://baba.ge"),
  title: {
    default: "baba.ge - ონლაინ მაღაზია საუკეთესო ფასად",
    template: "%s | Baba.ge",
  },
  applicationName: "Baba.ge",
  description:
    "Baba.ge ონლაინ მაღაზია — შეიძინეთ მობილური ტელეფონები, ავეჯი, ტექნიკა, კომპიუტერები და სხვა პროდუქტები საუკეთესო ფასად.",
  alternates: {
    canonical: "/",
    languages: {
      "ka-GE": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Baba.ge ონლაინ მაღაზია",
    description: "შეიძინეთ ტექნიკა, ავეჯი და სხვა პროდუქტები ონლაინ საუკეთესო ფასად.",
    url: "https://baba.ge/",
    siteName: "Baba.ge",
    type: "website",
    locale: "ka_GE",
    images: [
      {
        url: "/images/logo.webp",
        width: 1200,
        height: 630,
        alt: "Baba.ge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baba.ge ონლაინ მაღაზია",
    description: "ონლაინ შოპინგი საუკეთესო ფასად საქართველოში.",
    images: ["/images/logo.webp"],
  },
  category: "ecommerce",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Baba.ge",
    url: "https://baba.ge/",
    inLanguage: "ka-GE",
    description:
      "Baba.ge ონლაინ მაღაზია — შეიძინეთ მობილური ტელეფონები, ავეჯი, ტექნიკა, კომპიუტერები და სხვა პროდუქტები საუკეთესო ფასად.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://baba.ge/products?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Baba.ge",
    url: "https://baba.ge/",
    sameAs: ["https://facebook.com", "https://linkedin.com"],
  };

  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Site navigation",
    itemListElement: [
      { "@type": "SiteNavigationElement", position: 1, name: "მთავარი", url: "https://baba.ge/" },
      { "@type": "SiteNavigationElement", position: 2, name: "ჩვენს შესახებ", url: "https://baba.ge/about" },
      { "@type": "SiteNavigationElement", position: 3, name: "კონტაქტი", url: "https://baba.ge/contact" },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "წესები და პირობები",
        url: "https://baba.ge/terms",
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "პირადი ინფორმაციის დაცვა",
        url: "https://baba.ge/privacy",
      },
    ],
  };

  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${montserrat.variable} ${helveticaNeue.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
