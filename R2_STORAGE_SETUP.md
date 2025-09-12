# 🗄️ R2 Storage Integration

## ✅ **Co je hotové:**

### **1. R2 Storage Library**

- ✅ AWS SDK S3-compatible client
- ✅ Presigned upload URLs (1 hodina)
- ✅ Presigned download URLs (24 hodin)
- ✅ File upload/download/delete
- ✅ Mock implementation pro development

### **2. API Integration**

- ✅ `POST /api/video/upload-init` - presigned upload URL
- ✅ `GET /api/video/file/:id` - expirační download link (24h)
- ✅ Whisper provider používá R2 storage

### **3. Security**

- ✅ User authentication required
- ✅ File ownership validation
- ✅ Expiring URLs (24h pro download, 1h pro upload)

## 🔧 **Environment Variables:**

Přidej do `.env`:

```bash
# Cloudflare R2
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="captioni-videos"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
```

## 🚀 **Jak to funguje:**

### **1. Video Upload**

```typescript
// 1. Uživatel požádá o upload URL
POST /api/video/upload-init
{
  "fileName": "video.mp4",
  "fileSize": 10485760,
  "mimeType": "video/mp4"
}

// 2. Server vytvoří presigned upload URL
{
  "uploadUrl": "https://r2.cloudflarestorage.com/bucket/videos/user123/1234567890-video.mp4?X-Amz-Algorithm=...",
  "fileId": "file_123",
  "expiresAt": "2024-01-15T12:00:00Z"
}

// 3. Frontend nahraje video přímo na R2
PUT uploadUrl
Content-Type: video/mp4
[Video data]
```

### **2. Video Download**

```typescript
// 1. Uživatel požádá o download URL
GET /api/video/file/file_123

// 2. Server vytvoří presigned download URL (24h)
{
  "downloadUrl": "https://r2.cloudflarestorage.com/bucket/videos/user123/1234567890-video.mp4?X-Amz-Algorithm=...",
  "expiresAt": "2024-01-16T12:00:00Z",
  "fileName": "video.mp4",
  "fileSizeBytes": 10485760
}
```

### **3. Whisper Processing**

```typescript
// 1. Whisper stáhne video z R2
const videoBuffer = await storage.downloadFile(storageKey);

// 2. Zpracuje audio
const audioBuffer = await extractAudio(videoBuffer);

// 3. Pošle na Whisper API
const transcript = await whisperAPI.transcribe(audioBuffer);
```

## 📊 **Storage Structure:**

```
captioni-videos/
├── videos/
│   └── user_123/
│       ├── 1234567890-video1.mp4
│       ├── 1234567891-video2.mp4
│       └── ...
├── rendered/
│   └── job_456/
│       ├── 456-result.mp4
│       └── ...
└── temp/
    └── processing/
        └── ...
```

## 🔒 **Security Features:**

### **1. Authentication**

- Všechny API endpoints vyžadují přihlášení
- User může přistupovat pouze ke svým souborům

### **2. File Ownership**

```typescript
// Kontrola vlastnictví souboru
const videoFile = await prisma.videoFile.findFirst({
  where: {
    id: fileId,
    userId: user.id, // Pouze vlastní soubory
  },
});
```

### **3. Expiring URLs**

- **Upload URLs**: 1 hodina
- **Download URLs**: 24 hodin
- Automatické vypršení bez možnosti obnovení

### **4. File Validation**

- Podporované formáty: MP4, MOV, WebM
- Maximální velikost: 100MB
- MIME type validation

## 💰 **Náklady:**

- **R2 Storage**: $0.015/GB/měsíc
- **Upload/Download**: Zdarma
- **1000 videí (60s, 10MB)**: ~$0.15/měsíc

## 🧪 **Development vs Production:**

### **Development (bez R2 credentials):**

```typescript
// Automaticky používá MockR2Storage
const storage = getStorage(); // Mock implementation
const url = await storage.getPresignedUploadUrl("test.mp4");
// Vrací: "https://mock-upload-url.com/test.mp4?expires=..."
```

### **Production (s R2 credentials):**

```typescript
// Používá reálnou R2Storage
const storage = getStorage(); // R2Storage implementation
const url = await storage.getPresignedUploadUrl("test.mp4");
// Vrací: "https://your-account-id.r2.cloudflarestorage.com/bucket/test.mp4?X-Amz-Algorithm=..."
```

## 🔄 **Workflow:**

```
1. User Upload Request
   ↓
2. Create VideoFile in DB
   ↓
3. Generate Presigned Upload URL (1h)
   ↓
4. User Uploads to R2
   ↓
5. User Requests Processing
   ↓
6. Whisper Downloads from R2
   ↓
7. Process & Render
   ↓
8. Generate Presigned Download URL (24h)
   ↓
9. User Downloads Result
```

## 📝 **API Endpoints:**

### **Upload Init**

```
POST /api/video/upload-init
Authorization: Required
Body: { fileName, fileSize, mimeType }
Response: { uploadUrl, fileId, expiresAt }
```

### **File Download**

```
GET /api/video/file/:id
Authorization: Required
Response: { downloadUrl, expiresAt, fileName, fileSizeBytes }
```

## 🚀 **Deploy:**

Na Vercelu bude vše fungovat s:

- R2 credentials v environment variables
- AWS SDK dependencies
- Automatic fallback na mock v development

**R2 Storage je připravený!** 🎉

## ⚠️ **Poznámky:**

- **Mock data** fungují i bez R2 credentials
- **Fallback** na mock při chybách
- **24h expirace** pro download URLs
- **1h expirace** pro upload URLs
- **TypeScript** strict mode
- **Error handling** s detaily
