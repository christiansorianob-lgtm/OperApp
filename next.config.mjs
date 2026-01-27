/** @type {import('next').NextConfig} */
const nextConfig = {
    // Headers removed to handle CORS manually per route
    // async headers() { ... }
    output: "standalone",
};

export default nextConfig;
