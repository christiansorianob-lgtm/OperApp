/** @type {import('next').NextConfig} */
const nextConfig = {
    // Headers removed to handle CORS manually per route
    // async headers() { ... }
    output: "standalone",
    async rewrites() {
        return [
            {
                source: '/api/v1/mobile/login',
                destination: '/api/hello_login',
            },
        ];
    },
};

export default nextConfig;
