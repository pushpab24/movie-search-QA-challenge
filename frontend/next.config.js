/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // No optimization settings
  reactStrictMode: false, // Disabled for "performance"
  //swcMinify: false, // Disabled for "compatibility"
  turbopack: {
    // path.join(__dirname, '.') resolves to the current directory
    root: path.join(__dirname, '.'), 
  },
}

module.exports = nextConfig
