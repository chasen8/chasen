/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 如果要允許載入外部圖片，在此加入 domains
  images: {
    domains: ['assets.coingecko.com'],
  },
};

module.exports = nextConfig;
