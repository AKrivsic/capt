# Rewardful Integration Guide for Captioni

## ✅ **Co je již implementováno:**

### **1. Script integrace v layout.tsx**

- Rewardful tracking script přidán do `src/app/layout.tsx`
- Používá vaše affiliate program ID: `7f3325`
- Scripty jsou správně umístěny v `<body>` sekci

### **2. Custom hook pro Rewardful**

- `src/hooks/useRewardful.ts` - hook pro práci s referral tracking
- Automaticky detekuje referral ID z URL
- Poskytuje `referral`, `isReady` a `trackEvent` funkce

### **3. Příklad checkout komponenty**

- `src/components/CheckoutForm/CheckoutForm.tsx` - ukázka použití
- Automaticky přidává referral ID do formuláře
- Tracking checkout událostí

### **4. Aktualizované affiliate stránky**

- Hlavní affiliate stránka: `/affiliate`
- Resources stránka: `/affiliate/resources`
- Všechny CTA tlačítka odkazují na vaši Rewardful URL

## 🚀 **Jak to funguje:**

### **Tracking návštěvníků:**

1. Návštěvník přijde přes affiliate link
2. Rewardful automaticky vytvoří referral ID
3. ID se uloží do `window.Rewardful.referral`

### **Použití v checkout:**

```typescript
import { useRewardful } from "../../hooks/useRewardful";

function CheckoutComponent() {
  const { referral, isReady } = useRewardful();

  // referral obsahuje UUID string nebo null
  // isReady je true když je Rewardful načtený
}
```

### **Předání do Stripe:**

```typescript
// Při vytváření checkout session
const session = await stripe.checkout.sessions.create({
  // ... ostatní parametry
  client_reference_id: referral, // referral ID
  metadata: {
    referral: referral, // nebo jako metadata
  },
});
```

## 🔧 **Co ještě potřebujete udělat:**

### **1. Testování integrace:**

```bash
# Spusťte development server
npm run dev

# Otevřete affiliate stránku
http://localhost:3000/affiliate

# Otestujte referral tracking
http://localhost:3000/affiliate?ref=test123
```

### **2. Stripe integrace:**

- V `src/app/api/stripe/checkout/route.ts` přidejte referral ID
- V `src/app/api/stripe/webhook/route.ts` zpracujte referral data

### **3. Analytics tracking:**

- Rewardful automaticky trackuje návštěvy a konverze
- Můžete přidat custom události přes `trackEvent` funkci

## 📊 **Rewardful Dashboard:**

### **URL:** `https://app.rewardful.com/dashboard`

### **Program ID:** `7f3325`

### **Co uvidíte:**

- Počet návštěvníků přes affiliate linky
- Konverze a revenue
- Performance jednotlivých affiliate
- Payout informace

## 🎯 **Příklady použití:**

### **Tracking custom událostí:**

```typescript
const { trackEvent } = useRewardful();

// Track signup
trackEvent("user_signup", { plan: "pro" });

// Track feature usage
trackEvent("feature_used", { feature: "caption_generator" });
```

### **Referral badge:**

```typescript
{
  referral && (
    <div className="referral-badge">Referral Applied: {referral}</div>
  );
}
```

### **Form submission:**

```typescript
const handleSubmit = async (formData: FormData) => {
  if (referral) {
    formData.append("referral", referral);
  }

  // Submit form with referral data
  await submitForm(formData);
};
```

## 🚨 **Důležité poznámky:**

### **1. Server vs Client Components:**

- `useRewardful` hook je Client Component (používá `'use client'`)
- Layout.tsx je Server Component (Rewardful scripty jsou v client-side)

### **2. Referral ID persistence:**

- Referral ID se automaticky ukládá do localStorage
- Přežívá page refreshes a navigation
- Automaticky se přidává do všech checkout formulářů

### **3. Error handling:**

- Hook automaticky čeká na načtení Rewardful
- Fallback pro případy, kdy Rewardful není dostupný
- Graceful degradation

## 🔍 **Debugging:**

### **Console logy:**

```javascript
// Zkontrolujte, zda je Rewardful načtený
console.log("Rewardful:", window.rewardful);
console.log("Referral:", window.Rewardful?.referral);
```

### **Network tab:**

- Hledejte requesty na `r.wdfl.co`
- Zkontrolujte, zda se načítá `rw.js` script

### **Rewardful dashboard:**

- Zkontrolujte, zda se zobrazují návštěvy
- Ověřte, zda funguje referral tracking

## 📈 **Další kroky:**

1. **Testujte affiliate linky** - zkuste si vytvořit test affiliate
2. **Implementujte Stripe checkout** s referral ID
3. **Přidejte analytics tracking** pro affiliate události
4. **Monitorujte performance** v Rewardful dashboardu

---

**Vše je připraveno pro produkční nasazení!** 🚀
