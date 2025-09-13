# Glossary

## Terminologie

### Core Concepts

**Generation**
- Proces vytváření textového obsahu pomocí AI
- Zahrnuje titulky, bio, hashtagy, DM, komentáře, story, hook
- Používá OpenAI GPT-4o-mini model

**Asset**
- Jakýkoliv soubor uložený v systému
- Primárně video soubory v Cloudflare R2
- Zahrnuje originální videa i zpracované výsledky

**Plan**
- Uživatelský subscription plán
- Definuje limity a funkce dostupné uživateli
- Typy: FREE, TEXT_STARTER, TEXT_PRO, VIDEO_LITE, VIDEO_PRO, VIDEO_UNLIMITED

**Job**
- Asynchronní úkol pro zpracování videa
- Spravuje se přes BullMQ queue
- Stavy: QUEUED, PROCESSING, COMPLETED, FAILED

**Style**
- Styl generovaného obsahu
- Typy: Barbie, Edgy, Glamour, Baddie, Innocent, Funny, Rage, Meme, Streamer
- Ovlivňuje tón a formát generovaného textu

### Technical Terms

**Queue**
- BullMQ queue systém pro asynchronní zpracování
- Uchovává joby pro video processing
- Používá Upstash Redis jako storage

**Worker**
- Background proces pro zpracování jobů
- Stahuje video, transkribuje, renderuje titulky
- Běží jako Vercel Function nebo dedicated proces

**Storage Key**
- Unikátní identifikátor souboru v R2
- Formát: `rendered/{jobId}-{timestamp}.mp4`
- Používá se pro upload/download operace

**Session**
- NextAuth.js session pro autentizaci
- Uchovává se v databázi
- Obsahuje user ID, plan, marketing consent

**Usage**
- Sledování spotřeby uživatele
- Text generations, video credits
- Resetuje se podle plánu (daily/monthly)

### Business Terms

**Credits**
- Video processing kredity
- Odečítají se při zpracování videa
- Lze dokoupit jako extra balíčky

**Limits**
- Omezení podle plánu
- Text generations per day/month
- Video duration, count per month

**Conversion**
- Přechod z free na paid plán
- Sleduje se pro business metrics
- Ovlivňuje revenue tracking

**Churn**
- Zrušení subscription
- Sleduje se pro retention analysis
- Důležité pro business health

### Platform Terms

**Platform**
- Cílová sociální síť
- Instagram, TikTok, X, OnlyFans
- Ovlivňuje formát generovaného obsahu

**Output Type**
- Typ generovaného obsahu
- Caption, bio, hashtags, dm, comments, story, hook
- Každý má specifické parametry

**Vibe**
- Uživatelský input pro generování
- 2-600 znaků popisující požadovaný obsah
- Používá se jako prompt pro AI

**Variants**
- Počet variant generovaného obsahu
- 1-5 variant podle typu
- Zajišťuje rozmanitost výstupu

### Integration Terms

**Webhook**
- HTTP callback pro externí služby
- Stripe, MailerLite, Resend
- Automatické aktualizace při událostech

**API Key**
- Autentizační klíč pro externí služby
- OpenAI, Stripe, MailerLite
- Uchovává se v environment variables

**Rate Limit**
- Omezení počtu requestů
- Implementováno v middleware
- Chrání před abuse

**Cron Job**
- Naplánovaný úkol
- Spouští se denně v 07:00 UTC
- Reset usage, cleanup, tracking

### Data Terms

**PII (Personally Identifiable Information)**
- Osobní údaje uživatelů
- Email, IP adresa, jméno
- Chráněno GDPR compliance

**Hash**
- Hashovaná IP adresa pro anonymní tracking
- Používá se pro rate limiting
- Zajišťuje privacy

**Transcript**
- Textový přepis videa
- Generuje OpenAI Whisper
- Používá se pro titulky

**Rendering**
- Proces vytváření finálního videa
- FFmpeg pipeline s titulky
- Výstup je MP4 soubor

### Error Terms

**Failed Job**
- Job, který selhal při zpracování
- Uchovává se pro debugging
- Může být retryován

**Rate Limit Exceeded**
- Překročení limitu requestů
- HTTP 429 status
- Uživatel musí počkat

**Validation Error**
- Neplatné input data
- HTTP 400 status
- Zod schema validation

**Internal Error**
- Neočekávaná chyba serveru
- HTTP 500 status
- Loguje se pro debugging

### Monitoring Terms

**Health Check**
- Kontrola stavu služeb
- Database, Redis, Storage, OpenAI
- Používá se pro monitoring

**Metrics**
- Kvantitativní data o systému
- Response time, error rate, throughput
- Sleduje se pro performance

**Alert**
- Upozornění na problém
- Email, Slack, SMS
- Triggered při threshold

**Dashboard**
- Přehled systémových metrik
- Real-time monitoring
- Používá se pro operations

### Security Terms

**CSRF (Cross-Site Request Forgery)**
- Bezpečnostní útok
- Chráněno NextAuth.js
- Zabezpečuje formuláře

**CORS (Cross-Origin Resource Sharing)**
- Kontrola cross-origin requestů
- Nastaveno v middleware
- Chrání API

**SSL/TLS**
- Šifrované spojení
- Povinné v produkci
- Chrání data v přenosu

**Session Hijacking**
- Krádež session tokenu
- Chráněno secure cookies
- Zabezpečuje autentizaci

### Deployment Terms

**Environment**
- Prostředí pro běh aplikace
- Development, staging, production
- Různé konfigurace

**Build**
- Kompilace aplikace
- Next.js build proces
- Vytváří production bundle

**Deploy**
- Nasazení na server
- Vercel deployment
- Aktualizuje produkci

**Rollback**
- Vrácení na předchozí verzi
- Vercel rollback
- Používá se při problémech

### External Services

**Vercel**
- Hosting platforma
- Next.js deployment
- Functions, Edge, Analytics

**Upstash**
- Redis hosting
- Queue storage
- Rate limiting

**Cloudflare R2**
- Object storage
- S3-compatible
- File hosting

**OpenAI**
- AI service provider
- GPT-4o-mini, Whisper
- Content generation

**Stripe**
- Payment processor
- Subscriptions, one-time
- Webhook handling

**MailerLite**
- Email marketing
- User segmentation
- Event tracking

**Resend**
- Email delivery
- Transactional emails
- Magic links

## Assumptions & Gaps

### Assumptions
- Terminologie je konzistentní napříč kódem
- Všechny termíny jsou správně definované
- Uživatelé rozumí business termínům

### Gaps
- Chybí technické diagramy s termíny
- Chybí cross-reference mezi termíny
- Chybí historie změn terminologie
