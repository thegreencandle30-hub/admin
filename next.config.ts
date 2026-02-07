import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Output configuration for Vercel deployment
  // 'standalone' creates a minimal production build
  // Comment out if you want default Vercel optimization
  // output: 'standalone',
  
  // Image optimization domains (add your domains here)
  images: {
    remotePatterns: [
      // Add remote image patterns if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
    // Disable image optimization if needed for serverless
    // unoptimized: true,
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Allow local network access in development
  experimental: {
    allowedDevOrigins: ['localhost:3000', '192.168.1.17:3000'],
  },
  
  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
