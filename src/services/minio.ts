import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate required environment variables - fail fast if not configured
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL; // Public URL for browser access
const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER;
const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD;
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'activados';

// Check configuration at module load time
if (!MINIO_ENDPOINT || !MINIO_ROOT_USER || !MINIO_ROOT_PASSWORD) {
  console.error('[MINIO] Configuration error: MINIO_ENDPOINT, MINIO_ROOT_USER, and MINIO_ROOT_PASSWORD must be set');
}

// Export config for use in other parts of the app
export const minioConfig = {
  endpoint: MINIO_ENDPOINT || '',
  publicUrl: MINIO_PUBLIC_URL || MINIO_ENDPOINT || '',
  bucket: BUCKET_NAME,
  isConfigured: !!(MINIO_ENDPOINT && MINIO_ROOT_USER && MINIO_ROOT_PASSWORD),
};

// Internal client for server-side operations (uploading)
export const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT || 'http://minio:9000',
  region: 'us-east-1',
  credentials: MINIO_ROOT_USER && MINIO_ROOT_PASSWORD
    ? {
        accessKeyId: MINIO_ROOT_USER,
        secretAccessKey: MINIO_ROOT_PASSWORD,
      }
    : undefined,
  forcePathStyle: true,
});

// Signing client for generating browser-reachable URLs
// En Dokploy/Container: usar endpoint interno, no el público
// El MINIO_PUBLIC_URL es solo para cuando se necesita una URL accessible públicamente
const signingClient = MINIO_PUBLIC_URL
  ? new S3Client({
      endpoint: MINIO_PUBLIC_URL, // URL externa (para desarrollo o cuando el server no puede alcanzar MinIO directo)
      region: 'us-east-1',
      credentials: {
        accessKeyId: MINIO_ROOT_USER!,
        secretAccessKey: MINIO_ROOT_PASSWORD!,
      },
      forcePathStyle: true,
    })
  : s3Client; // Usa el mismo client que el interno

export const getImageUrl = async (key: string | null) => {
  if (!key) return null;
  if (key.startsWith('data:image') || key.startsWith('http')) {
    return key;
  }
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    // Use the signingClient which respects the public URL
    return await getSignedUrl(signingClient, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

export const uploadBase64Image = async (base64String: string, filename: string) => {
  try {
    // Extract format and actual bas64 string
    const match = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 string');
    
    const mimeType = `image/${match[1]}`;
    const buffer = Buffer.from(match[2], 'base64');
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: mimeType,
    });
    
    await s3Client.send(command);
    return filename; // Devuelve la llave (key) que usamos en la tabla de DB
  } catch (error) {
    console.error('Error uploading to Minio:', error);
    throw error;
  }
};
