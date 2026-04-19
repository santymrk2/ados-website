import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://minio:9000';
const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER || 'minioadmin';
const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'activados';

export const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1', // MinIO requires a region, us-east-1 is standard default
  credentials: {
    accessKeyId: MINIO_ROOT_USER,
    secretAccessKey: MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true, // MUST be true for MinIO
});

export const getImageUrl = async (key: string | null) => {
  if (!key) return null;
  // If no prefix, assume it is an S3 key. Otherwise it's already an external URL or Base64 (legacy)
  if (key.startsWith('data:image') || key.startsWith('http')) {
    return key;
  }
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    // Devuelve una URL firmada de 1 hora de validez
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
