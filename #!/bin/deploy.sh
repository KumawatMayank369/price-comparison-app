#!/bin/bash

echo "🚀 PricePulse Deployment Script"
echo "================================"
echo ""

echo "📦 Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. git add ."
echo "2. git commit -m 'Ready for deployment'"
echo "3. git push origin main"
echo ""
echo "4. Deploy on Vercel:"
echo "   - Backend: Root Directory = backend"
echo "   - Frontend: Root Directory = frontend"
echo ""
echo "🎉 Done!"
