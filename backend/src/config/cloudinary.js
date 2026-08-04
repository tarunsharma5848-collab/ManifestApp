import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generates a short-lived signed URL for a privately-uploaded (type: 'authenticated')
// image. Without this, anyone with the plain Cloudinary URL could view the image
// even without logging in — this is what caused vision board images to be publicly
// readable. Default expiry: 1 hour.
export function getSignedImageUrl(publicId, expiresInSeconds = 3600) {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}

export default cloudinary;
