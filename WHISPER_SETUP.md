# 🎤 Whisper Integration Setup

## ✅ **Co je hotové:**

### **1. Whisper Provider**

- ✅ Reálná integrace s OpenAI Whisper API
- ✅ Word-level timestamps
- ✅ Jazyková detekce
- ✅ Progress callbacks
- ✅ Fallback na mock data

### **2. API Integration**

- ✅ Automatické volání Whisper při zpracování videa
- ✅ Progress tracking v databázi
- ✅ Error handling s fallback

## 🔧 **Environment Variables:**

Přidej do `.env`:

```bash
# OpenAI (Whisper)
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

## 🚀 **Jak to funguje:**

### **1. Video Upload**

```typescript
// Uživatel nahraje video
POST /api/video/upload-init
→ Vytvoří VideoFile v DB
→ Vrátí presigned URL
```

### **2. Processing**

```typescript
// Uživatel spustí zpracování
POST /api/video/process
→ Vytvoří SubtitleJob
→ Odečte kredit
→ Spustí background job
```

### **3. Whisper Transcription**

```typescript
// Background job volá Whisper
const whisperProvider = new WhisperProvider();
const transcript = await whisperProvider.transcribe({
  storageKey: "video-file-key",
  language: "auto",
});
```

### **4. Progress Updates**

```typescript
// Progress se ukládá do DB
onProgress({ phase: 'processing', progress: 50 })
→ UPDATE subtitle_job SET progress = 50
```

## 📊 **Whisper Response Format:**

```typescript
{
  words: [
    { text: "Hello", start: 0.0, end: 0.5, confidence: 0.95 },
    { text: "world", start: 0.6, end: 1.0, confidence: 0.98 }
  ],
  language: "en",
  confidence: 0.94
}
```

## 🎯 **Co ještě potřebuješ:**

### **1. Storage (R2/S3)**

```bash
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="captioni-videos"
```

### **2. FFmpeg (Rendering)**

- Nainstalovat na Vercel server
- Pro rendering titulků do videa

## 💰 **Náklady:**

- **Whisper**: $0.006/minuta
- **60s video**: ~$0.006
- **1000 videí**: ~$6

## 🧪 **Testování:**

1. **S API key**: Reálná transkripce
2. **Bez API key**: Mock data (fallback)
3. **Chyba API**: Automatický fallback

## 🔄 **Workflow:**

```
Video Upload → Storage → Whisper → Transcript → FFmpeg → Rendered Video
     ↓              ↓         ↓          ↓         ↓           ↓
   Progress      Progress  Progress   Progress  Progress   Complete
```

## 📝 **Poznámky:**

- **Mock data** fungují i bez API key
- **Fallback** na mock při chybách
- **Progress tracking** v reálném čase
- **Error handling** s detaily
- **TypeScript** strict mode

## 🚀 **Deploy:**

Na Vercelu bude vše fungovat s:

- PostgreSQL databází
- OpenAI API key
- R2 storage
- FFmpeg server

**Whisper integrace je připravená!** 🎉
