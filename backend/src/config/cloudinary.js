const cloudinary = require('cloudinary').v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadToCloudinary = async (filePath, folder = 'cricket_auction') => {
  if (!isConfigured) {
    return null;
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image'
  });
  return result.secure_url;
};

module.exports = { cloudinary, isConfigured, uploadToCloudinary };
