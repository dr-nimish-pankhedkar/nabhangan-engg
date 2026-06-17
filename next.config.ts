import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "nabhangan-engg.vercel.app" }],
        destination: "https://nabhangan.chemiligence.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
