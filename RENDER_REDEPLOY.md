# Manual Render Redeploy Instructions

## 🚨 Your backend needs to redeploy with the latest fixes

---

## Quick Steps:

### 1. Go to Render Dashboard
Visit: **https://dashboard.render.com/**

### 2. Find Your Service
Look for: **maternal-server**

### 3. Trigger Manual Deploy
Click the **"Manual Deploy"** button
- Select: **"Deploy latest commit"**
- Click: **"Deploy"**

### 4. Wait for Deployment
- Takes about 2-3 minutes
- Watch the logs
- Wait for "Live" status

---

## What This Will Fix:

✅ Increased rate limits (5 → 20 for auth, added 50 limit for admin)  
✅ Updated CORS to include all Vercel URLs  
✅ Admin permissions properly set  

---

## After Redeployment:

1. Wait 1 minute for services to fully start
2. Go back to your admin login page
3. Try logging in again
4. Should work without 403 error!

---

## Alternative: Wait 15 Minutes

If you don't want to redeploy manually, the rate limiter will reset automatically after 15 minutes from your first failed attempt.

---

## Check Backend Status

Test if backend is responding:
```
https://maternal-server.onrender.com/health
```

Should show:
```json
{
  "status": "OK",
  "database": "connected"
}
```
