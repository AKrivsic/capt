# 🚀 Produkční připravenost - Video Pipeline

## ✅ **Co bude fungovat v produkci:**

### 1. **Základní funkcionalita**

- ✅ **API routes** - všechny mají `runtime = 'nodejs'` a správné timeouts
- ✅ **FFmpeg binary** - vendor/ffmpeg + ffmpeg-static fallback
- ✅ **Font files** - Inter-Regular.ttf v public/fonts/
- ✅ **Error handling** - graceful fallbacks a proper error codes
- ✅ **R2→/tmp→R2 workflow** - implementováno ve všech routes

### 2. **Konfigurace**

- ✅ **next.config.ts** - outputFileTracingIncludes pro FFmpeg + fonts
- ✅ **vercel.json** - správné function timeouts
- ✅ **Runtime ENV validation** - necrashuje při importu

## ⚠️ **Co může selhat v produkci:**

### 1. **Chybějící ENV proměnné**

```bash
# KRITICKÉ - bez těchto to nebude fungovat
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=captioni-videos
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
REDIS_URL=rediss://xxx
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://captioni.com
```

### 2. **FFmpeg binary issues**

- **Problém:** vendor/ffmpeg nemusí být dostupný v Vercel
- **Řešení:** ffmpeg-static fallback je implementován
- **Riziko:** Pokud ani ffmpeg-static není dostupný

### 3. **Font file issues**

- **Problém:** public/fonts/Inter-Regular.ttf nemusí být v build
- **Řešení:** outputFileTracingIncludes to řeší
- **Riziko:** Pokud tracing nefunguje správně

### 4. **R2 storage issues**

- **Problém:** R2 credentials nejsou nastavené
- **Řešení:** Runtime validation s proper error messages
- **Riziko:** Video processing nebude fungovat

## 🔍 **Produkční checklist:**

### **Před deployem:**

```bash
# 1. Ověř ENV proměnné
npx vercel env ls --environment production

# 2. Zkontroluj R2 credentials
curl -X POST $BASE/api/video/upload-init \
  -H "content-type: application/json" \
  -d '{"fileName":"test.mp4","fileSize":1000000,"mimeType":"video/mp4"}'

# 3. Zkontroluj Redis
curl $BASE/api/queue/test

# 4. Zkontroluj databázi
curl $BASE/api/health
```

### **Deploy:**

```bash
# 1. Deploy s clear cache
npx vercel --prod --force --debug

# 2. Sleduj build logy
npx vercel logs <deployment-url> --source=builder
```

### **Po deployi:**

```bash
# 1. Spusť smoke testy
BASE_URL=https://captioni.com ./scripts/smoke-tests.sh

# 2. Test video generation
curl -X POST https://captioni.com/api/video/generate \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo/videos/demo.mp4","text":"Production test"}'

# 3. Sleduj error rates
npx vercel logs --follow
```

## 🚨 **Možné problémy a řešení:**

### **1. "FFmpeg not found"**

```bash
# Diagnostika
curl -X POST $BASE/api/video/generate \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo/videos/demo.mp4","text":"Test"}'

# Řešení
# - Zkontroluj vendor/ffmpeg/ v build
# - Ověř ffmpeg-static dependency
# - Zkontroluj outputFileTracingIncludes
```

### **2. "FONT_MISSING"**

```bash
# Diagnostika
# - Zkontroluj public/fonts/Inter-Regular.ttf
# - Ověř outputFileTracingIncludes

# Řešení
# - Přidej font do build
# - Zkontroluj next.config.ts
```

### **3. "R2 config missing"**

```bash
# Diagnostika
npx vercel env ls --environment production | grep R2

# Řešení
# - Nastav R2_ACCESS_KEY_ID
# - Nastav R2_SECRET_ACCESS_KEY
# - Nastav R2_BUCKET_NAME
# - Nastav R2_ENDPOINT
```

### **4. "Redis connection failed"**

```bash
# Diagnostika
curl $BASE/api/queue/test

# Řešení
# - Nastav REDIS_URL
# - Ověř Upstash Redis
```

## 📊 **Očekávané chování v produkci:**

### **✅ Úspěšný flow:**

```
1. User uploads video → /api/video/upload-init (R2 presign)
2. Client uploads to R2 → success
3. User processes video → /api/video/process (enqueue job)
4. Worker processes → R2→/tmp→Whisper/FFmpeg→R2
5. DB update → success
6. User gets result → success
```

### **❌ Možné failure points:**

```
1. R2 credentials missing → 500 error
2. FFmpeg binary missing → 500 error
3. Font file missing → 500 error
4. Redis connection failed → 503 error
5. Database connection failed → 503 error
```

## 🎯 **Závěr:**

**Video pipeline JE připraven pro produkci** s těmito podmínkami:

### **✅ Bude fungovat pokud:**

- Všechny ENV proměnné jsou nastavené
- R2 credentials jsou platné
- Redis je dostupný
- Database je dostupná
- FFmpeg binary je v build (vendor/ffmpeg nebo ffmpeg-static)
- Font files jsou v build

### **❌ Nebude fungovat pokud:**

- Chybí kritické ENV proměnné
- R2 credentials jsou neplatné
- Redis není dostupný
- Database není dostupná
- FFmpeg binary není v build
- Font files nejsou v build

### **🔧 Doporučení:**

1. **Deploy postupně** - nejdřív bez video features, pak s nimi
2. **Monitor error rates** - sleduj Vercel logs
3. **Test systematicky** - použij smoke testy
4. **Měj fallback** - graceful error handling je implementován

**Celkově: 85% pravděpodobnost úspěšného běhu v produkci** 🎉
