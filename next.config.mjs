/** @type {import('next').NextConfig} */
const nextConfig = {
    // Headers removed to handle CORS manually per route
    output: "standalone",
    // rewrites removed to restore normal routing
};

export default nextConfig;
