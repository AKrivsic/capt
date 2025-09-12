# 💳 Stripe Billing Setup

## ✅ **Implementováno:**

### **1. Datový model**

- ✅ Nové plány: `FREE`, `TEXT_STARTER`, `TEXT_PRO`, `VIDEO_LITE`, `VIDEO_PRO`, `VIDEO_UNLIMITED`
- ✅ Text generace limity: `textGenerationsLeft`, `textGenerationsUsed`
- ✅ Video kredity: `videoCredits`
- ✅ Stripe customer ID: `stripeCustomerId`
- ✅ Extra kredity SKU: `EXTRA_10_VIDEOS`, `EXTRA_25_VIDEOS`, `EXTRA_50_VIDEOS`

### **2. Plánové limity**

```typescript
FREE: { text: 3, video: 0 }
TEXT_STARTER: { text: 100, video: 0 }
TEXT_PRO: { text: -1, video: 0 } // unlimited
VIDEO_LITE: { text: 100, video: 20 }
VIDEO_PRO: { text: -1, video: 50 }
VIDEO_UNLIMITED: { text: -1, video: -1 } // unlimited
```

### **3. Stripe Webhook**

- ✅ `invoice.payment_succeeded` → obnov limity
- ✅ `invoice.payment_failed` → přepni na FREE
- ✅ `customer.subscription.deleted` → přepni na FREE
- ✅ `payment_intent.succeeded` → přidej extra kredity

### **4. API Endpoints**

- ✅ `POST /api/billing/create-subscription` - subscription plány
- ✅ `POST /api/billing/create-payment-intent` - extra kredity
- ✅ `GET /api/user/limits` - aktuální limity uživatele

### **5. Limit Management**

- ✅ `checkTextGenerationLimit()` - kontrola text limitů
- ✅ `checkVideoCreditsLimit()` - kontrola video kreditů
- ✅ `consumeTextGeneration()` - odečtení text generace
- ✅ `consumeVideoCredit()` - odečtení video kreditu

## 🔧 **Co potřebuješ nastavit v Stripe:**

### **1. Subscription Products (měsíční)**

```
Text Starter - $9/měsíc
Text Pro - $17/měsíc
Video Lite - $19/měsíc
Video Pro - $39/měsíc
Video Unlimited - $89/měsíc
```

### **2. One-time Products (extra kredity)**

```
10 Extra Videos - $7
25 Extra Videos - $20
50 Extra Videos - $40
```

### **3. Environment Variables**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **4. Webhook Events**

Nastav webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

Events to listen for:

- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `payment_intent.succeeded`

## 🎯 **Jak to funguje:**

### **Subscription Flow:**

1. Uživatel klikne "Start for $9" → `POST /api/billing/create-subscription`
2. Stripe Checkout → platba
3. Webhook `invoice.payment_succeeded` → obnov limity
4. Uživatel má 100 text generací

### **Extra Credits Flow:**

1. Uživatel klikne "10 extra → $7" → `POST /api/billing/create-payment-intent`
2. Stripe Checkout → platba
3. Webhook `payment_intent.succeeded` → přidej 10 video kreditů

### **Limit Checking:**

```typescript
// Před generováním textu
const limitCheck = checkTextGenerationLimit(userLimits);
if (!limitCheck.allowed) {
  return "Dosáhli jste limitu";
}

// Odečti generaci
await consumeTextGeneration(userId, prisma);
```

## 🚀 **Výhody tohoto řešení:**

- ✅ **Jednoduché** - Stripe řeší billing
- ✅ **Spolehlivé** - webhook garantuje doručení
- ✅ **Automatické** - žádné cron joby
- ✅ **Škálovatelné** - Stripe to zvládne
- ✅ **Méně kódu** - méně bugů

## 📋 **TODO po nastavení Stripe:**

1. **Vytvoř produkty v Stripe Dashboard**
2. **Zkopíruj Price IDs do `src/constants/plans.ts`**
3. **Nastav webhook endpoint**
4. **Testuj s Stripe test mode**

**Tvoje logika byla správná - jednodušší je lepší!** 🎉
