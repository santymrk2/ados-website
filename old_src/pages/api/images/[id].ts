import type { APIRoute } from 'astro';
import { s3Client } from '../../../lib/minio';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'activados';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response('Not found', { status: 404 });

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: id,
    });
    
    const data = await s3Client.send(command);
    if (!data.Body) return new Response('Not found', { status: 404 });
    
    return new Response(data.Body as any, {
      headers: {
        'Content-Type': data.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      }
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return new Response('Not found', { status: 404 });
  }
}
