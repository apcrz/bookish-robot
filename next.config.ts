import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true 
  }
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ['192.168.237.69', '192.168.237.91'],
};

export default withPWA(nextConfig);
