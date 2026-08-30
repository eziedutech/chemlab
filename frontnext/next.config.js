/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the runtime image small in the multi stage build.
  output: "standalone",
  webpack: (config) => {
    // Required later by @react-three/rapier, which ships a WebAssembly module.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
