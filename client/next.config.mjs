/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    serverExternalPackages: [
        "@mastra/duckdb",
        "@duckdb/node-api",
        "@duckdb/node-bindings",
    ],
};

export default nextConfig;
