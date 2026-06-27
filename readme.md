# PricePulse - MERN Price Comparison Platform

Compare product prices across Amazon and Flipkart with live analytics.

## 🚀 Quick Deploy

### 1. Setup MongoDB Atlas
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create cluster and get connection string

### 2. Deploy Backend to Vercel
```bash
# Push to GitHub first
git push origin main

# Then deploy on Vercel:
# - Import GitHub repo
# - Root: backend
# - Add env: MONGODB_URI, JWT_SECRET
