/**
 * Centralized internal nav URLs for the site header (SEO + consistency).
 */

export type HeaderNavLink = {
  href: string;
  label: string;
};

/** Top bar — left cluster */
export const headerTopLeftLinks: HeaderNavLink[] = [
  { href: "/", label: "მთავარი" },
  { href: "/about-us", label: "ჩვენს შესახებ" },
  { href: "/contact", label: "კონტაქტი" },
  { href: "/cesebi-da-pirobebi-929323138", label: "წესები და პირობები" },
];

/** Top bar — center */
export const headerTopCenterLink: HeaderNavLink = {
  href: "/privacy-policy",
  label: "პირადი ინფორმაციის დაცვა",
};

/** Top bar — right cluster */
export const headerTopRightLinks: HeaderNavLink[] = [
  { href: "/onlain-ganvadeba", label: "ონლაინ განვადება" },
  { href: "/miwodebis-pirobebi", label: "მიწოდების პირობები" },
];

/** Mobile top strip — same destinations + account */
export const headerMobileScrollLinks: HeaderNavLink[] = [
  ...headerTopLeftLinks,
  headerTopCenterLink,
  ...headerTopRightLinks,
  { href: "/auth/login", label: "შესვლა" },
];
