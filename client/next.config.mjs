/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    serverExternalPackages: [
        "@mastra/duckdb",
        "@duckdb/node-api",
        "@duckdb/node-bindings",
        "@duckdb/node-bindings-darwin-arm64",
    ],
};

export default nextConfig;
