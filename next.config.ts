import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ['192.168.237.69', '192.168.237.91'],
};

export default nextConfig;
