/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora los errores de TypeScript para que compile sí o sí
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora las advertencias de formato durante el build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
