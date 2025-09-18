import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Storage configuration - no mocky, throw on missing env
function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error('R2_STORAGE_NOT_CONFIGURED: Missing required R2 environment variables');
  }

  return {
    endpoint,
    bucketName,
    accessKeyId,
    secretAccessKey
  };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getR2Config();
    s3Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

export function getStorage() {
  return {
    async downloadFile(key: string): Promise<Buffer> {
      try {
        const config = getR2Config();
        const client = getS3Client();
        
        const command = new GetObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        });

        const response = await client.send(command);
        
        if (!response.Body) {
          throw new Error(`R2_DOWNLOAD_FAILED: No body in response for key ${key}`);
        }

        const chunks: Uint8Array[] = [];
        const stream = response.Body as any;
        
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        return Buffer.concat(chunks);
      } catch (error) {
        if (error instanceof Error && error.name === 'NoSuchKey') {
          throw new Error(`R2_FILE_NOT_FOUND: ${key}`);
        }
        throw new Error(`R2_DOWNLOAD_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async uploadFile(key: string, data: Buffer, contentType: string): Promise<string> {
      try {
        const config = getR2Config();
        const client = getS3Client();
        
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: key,
          Body: data,
          ContentType: contentType,
        });

        await client.send(command);
        return key;
      } catch (error) {
        throw new Error(`R2_UPLOAD_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
      try {
        const config = getR2Config();
        const client = getS3Client();
        
        const command = new GetObjectCommand({
          Bucket: config.bucketName,
          Key: key,
        });

        return await getSignedUrl(client, command, { expiresIn });
      } catch (error) {
        throw new Error(`R2_PRESIGNED_URL_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
      try {
        const config = getR2Config();
        const client = getS3Client();
        
        const command = new PutObjectCommand({
          Bucket: config.bucketName,
          Key: key,
          ContentType: contentType,
        });

        return await getSignedUrl(client, command, { expiresIn });
      } catch (error) {
        throw new Error(`R2_PRESIGNED_UPLOAD_URL_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}