/**
 * Cloudflare R2 Storage Integration
 * Handles file uploads, downloads, and presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  region?: string;
}

export class R2Storage {
  private client: S3Client;
  private bucketName: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    
    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });
  }

  /**
   * Generate presigned URL for file upload
   * @param key - File key in bucket
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Presigned upload URL
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate presigned URL for file download
   * @param key - File key in bucket
   * @param expiresIn - Expiration time in seconds (default: 24 hours)
   * @returns Presigned download URL
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 86400): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Upload file directly to R2
   * @param key - File key in bucket
   * @param body - File content
   * @param contentType - MIME type
   */
  async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string = 'video/mp4'): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Download file from R2
   * @param key - File key in bucket
   * @returns File content as Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('File not found');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Delete file from R2
   * @param key - File key in bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Check if file exists in R2
   * @param key - File key in bucket
   * @returns True if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get public URL for file (if bucket is public)
   * @param key - File key in bucket
   * @returns Public URL
   */
  async getPublicUrl(key: string): Promise<string> {
    const publicBase = process.env.R2_PUBLIC_BASE_URL;
    if (publicBase) {
      return `${publicBase}/${key}`;
    }
    // Fallback to presigned URL
    return this.getPresignedDownloadUrl(key, 86400);
  }

  /**
   * Get signed download URL (alias for getPresignedDownloadUrl)
   * @param key - File key in bucket
   * @param ttlSeconds - Time to live in seconds
   * @returns Signed download URL
   */
  async getSignedDownloadUrl(key: string, ttlSeconds: number = 86400): Promise<string> {
    return this.getPresignedDownloadUrl(key, ttlSeconds);
  }

  /**
   * Get file URL (alias for getPublicUrl)
   * @param key - File key in bucket
   * @returns File URL
   */
  getFileUrl(key: string): string {
    const publicBase = process.env.R2_PUBLIC_BASE_URL;
    if (publicBase) {
      return `${publicBase}/${key}`;
    }
    // Fallback - return key for relative path
    return `/r2/${key}`;
  }

  /**
   * List files in directory
   * @param prefix - Directory prefix
   * @returns List of files
   */
  async listFiles(prefix: string): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
      });

      const response = await this.client.send(command);
      return (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}

// Singleton instance
let r2Storage: R2Storage | null = null;

export function getR2Storage(): R2Storage {
  if (!r2Storage) {
    const config: R2Config = {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      bucketName: process.env.R2_BUCKET_NAME || 'captioni-videos',
      endpoint: process.env.R2_ENDPOINT || '',
      region: 'auto',
    };

    if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint) {
      throw new Error('R2 configuration is incomplete. Please check environment variables.');
    }

    r2Storage = new R2Storage(config);
  }

  return r2Storage;
}

// Mock implementation for development
export class MockR2Storage {
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    console.log(`Mock presigned upload URL for ${key}, type: ${contentType}, expires in ${expiresIn}s`);
    return `/api/mock/upload/${key}?expires=${Date.now() + expiresIn * 1000}&contentType=${encodeURIComponent(contentType)}`;
  }

  async getPresignedDownloadUrl(key: string, expiresIn: number = 86400): Promise<string> {
    console.log(`Mock presigned download URL for ${key}, expires in ${expiresIn}s`);
    return `/api/mock/download/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }

  async uploadFile(key: string, body: Buffer | Uint8Array, contentType: string = 'video/mp4'): Promise<void> {
    console.log(`Mock upload file ${key}, size: ${body.length} bytes, type: ${contentType}`);
  }

  async downloadFile(key: string): Promise<Buffer> {
    console.log(`Mock download file ${key}`);
    return Buffer.from('mock file content');
  }

  async deleteFile(key: string): Promise<void> {
    console.log(`Mock delete file ${key}`);
  }

  async fileExists(key: string): Promise<boolean> {
    console.log(`Mock check file exists ${key}`);
    // Mock returns false for demo files to test fallback
    return !key.startsWith('demo/');
  }

  /**
   * Get public URL for file (mock)
   * @param key - File key in bucket
   * @returns Public URL
   */
  async getPublicUrl(key: string): Promise<string> {
    console.log(`Mock get public URL for ${key}`);
    return `/api/mock/public/${key}`;
  }

  /**
   * Get signed download URL (mock)
   * @param key - File key in bucket
   * @param ttlSeconds - Time to live in seconds
   * @returns Signed download URL
   */
  async getSignedDownloadUrl(key: string, ttlSeconds: number = 86400): Promise<string> {
    console.log(`Mock get signed download URL for ${key}, TTL: ${ttlSeconds}s`);
    return `/api/mock/signed/${key}?expires=${Date.now() + ttlSeconds * 1000}`;
  }

  /**
   * Get file URL (mock)
   * @param key - File key in bucket
   * @returns File URL
   */
  getFileUrl(key: string): string {
    console.log(`Mock get file URL for ${key}`);
    return `/api/mock/file/${key}`;
  }

  /**
   * List files in directory (mock)
   * @param prefix - Directory prefix
   * @returns List of files
   */
  async listFiles(prefix: string): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    console.log(`Mock list files with prefix ${prefix}`);
    // Return empty array for demo files to simulate no files found
    return [];
  }
}

// Export appropriate storage based on environment
export function getStorage() {
  if (process.env.NODE_ENV === 'development' && !process.env.R2_ACCESS_KEY_ID) {
    return new MockR2Storage();
  }
  return getR2Storage();
}
