/** @type {import('next').NextConfig} */
const nextConfig = {
    // Headers removed to handle CORS manually per route
    // async headers() { ... }
    // output: "standalone", // Removed for Vercel compatibility
    // rewrites removed to restore normal routing
    /*
    async rewrites() {
        return [
            {
                source: '/api/v1/mobile/login',
                destination: '/api/hello',
            },
        ];
    },
    */
};

export default nextConfig;
