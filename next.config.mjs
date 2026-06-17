/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` keeps Vercel happy and also lets you deploy the same build to
  // Azure App Service later (matches the pattern used on your other apps).
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage public bucket
      { protocol: "https", hostname: "*.supabase.co" },
      // Common cover-image / avatar sources
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    // next-mdx-remote/rsc + server actions
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
