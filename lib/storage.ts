import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize DigitalOcean Spaces client (S3-compatible)
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT, // e.g., https://nyc3.digitaloceanspaces.com
  region: process.env.DO_SPACES_REGION || "us-east-1", // e.g., nyc3
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET || "",
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || "";

export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string,
  userId: string
): Promise<{ url: string; key: string }> {
  // Generate unique file key
  const timestamp = Date.now();
  const key = `resumes/${userId}/${timestamp}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ACL: "public-read", // or "private" if you want to control access
  });

  // Generate presigned URL valid for 15 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { url, key };
}

export function getPublicUrl(key: string): string {
  return `${process.env.DO_SPACES_CDN_ENDPOINT || process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${key}`;
}

