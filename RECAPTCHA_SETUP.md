# reCAPTCHA Setup Instructions

## 1. Google reCAPTCHA Configuration

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Choose **reCAPTCHA v3**
4. Add your domain(s):
   - For development: `localhost`
   - For production: `captioni.com`
5. Accept the terms and click "Submit"

## 2. Environment Variables

Add these environment variables to your production environment (Vercel):

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

## 3. How it works

- **Magic Link Sign In**: reCAPTCHA v3 runs invisibly in the background
- **Google Sign In**: No reCAPTCHA required (Google handles security)
- **Score Threshold**: Set to 0.5 (adjust in `/api/auth/recaptcha/route.ts` if needed)

## 4. Testing

- reCAPTCHA v3 is invisible to users
- Score ranges from 0.0 (bot) to 1.0 (human)
- Lower scores trigger "Security check failed" message
- Check server logs for reCAPTCHA scores and errors

## 5. Security Notes

- reCAPTCHA v3 is less intrusive than v2
- Automatically adapts to user behavior
- No CAPTCHA puzzles for legitimate users
- Protects against automated attacks and spam

