import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["static.usernames.app-backend.toolsforhumanity.com"],
  },
  allowedDevOrigins: ["*", "*.ngrok-free.app", "*.netlify.app"],
  reactStrictMode: false,
};

export default nextConfig;
