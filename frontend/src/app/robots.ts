import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amruthachicken.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/customer/', '/order-track'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
