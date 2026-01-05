/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/chat': ['./data/embeddings.json'],
  },
};

export default nextConfig;
