import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.AWS_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "";

export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string,
  userId: string
): Promise<{ url: string; key: string }> {
  // Generate unique file key
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `resumes/${userId}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    // Removed ACL to avoid CORS issues - bucket should have default ACL policy
  });

  // Generate presigned URL valid for 15 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { url, key };
}

export function getPublicUrl(key: string): string {
  const region = process.env.AWS_REGION || process.env.AWS_S3_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET || "";
  
  // Use CloudFront CDN URL if available, otherwise use S3 direct URL
  if (process.env.AWS_CLOUDFRONT_URL) {
    return `${process.env.AWS_CLOUDFRONT_URL}/${key}`;
  }
  
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

