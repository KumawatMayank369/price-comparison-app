const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// ==================== MODELS ====================

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  category: String,
  sources: [{
    retailer: { type: String, enum: ['Amazon', 'Flipkart'] },
    price: Number,
    url: String,
    availability: { type: Boolean, default: true },
    rating: Number,
    lastChecked: { type: Date, default: Date.now }
  }],
  priceHistory: [{
    price: Number,
    retailer: String,
    date: { type: Date, default: Date.now }
  }],
  lowestPrice: Number,
  highestPrice: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// ==================== SAMPLE DATA ====================

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max 256GB',
    description: 'Apple iPhone 15 Pro Max with A17 Pro chip, Titanium design, USB-C',
    imageUrl: 'https://m.media-amazon.com/images/I/61l9ppRIiqL._SL1500_.jpg',
    category: 'Electronics',
    sources: [
      { retailer: 'Amazon', price: 159900, url: 'https://amazon.in/dp/B0CHX2F5P8', availability: true, rating: 4.5 },
      { retailer: 'Flipkart', price: 149999, url: 'https://flipkart.com/apple-iphone-15-pro-max', availability: true, rating: 4.7 }
    ],
    lowestPrice: 149999,
    highestPrice: 159900
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB',
    description: 'Samsung Galaxy S24 Ultra with AI features, S Pen, 200MP camera',
    imageUrl: 'https://m.media-amazon.com/images/I/71r2hP3wA9L._SL1500_.jpg',
    category: 'Electronics',
    sources: [
      { retailer: 'Amazon', price: 129999, url: 'https://amazon.in/dp/B0CMDX3W4V', availability: true, rating: 4.6 },
      { retailer: 'Flipkart', price: 124999, url: 'https://flipkart.com/samsung-galaxy-s24-ultra', availability: true, rating: 4.8 }
    ],
    lowestPrice: 124999,
    highestPrice: 129999
  },
  {
    name: 'MacBook Air M3 13-inch',
    description: 'Apple MacBook Air with M3 chip, 13.6-inch Liquid Retina display',
    imageUrl: 'https://m.media-amazon.com/images/I/71vFKBpDgkL._SL1500_.jpg',
    category: 'Electronics',
    sources: [
      { retailer: 'Amazon', price: 114900, url: 'https://amazon.in/dp/B0CX23V2ZK', availability: true, rating: 4.8 },
      { retailer: 'Flipkart', price: 109999, url: 'https://flipkart.com/apple-macbook-air-m3', availability: true, rating: 4.9 }
    ],
    lowestPrice: 109999,
    highestPrice: 114900
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Sony WH-1000XM5 Premium Noise Cancelling Headphones',
    imageUrl: 'https://m.media-amazon.com/images/I/61+FqBTRJxL._SL1500_.jpg',
    category: 'Audio',
    sources: [
      { retailer: 'Amazon', price: 29900, url: 'https://amazon.in/dp/B09XS7JWHH', availability: true, rating: 4.7 },
      { retailer: 'Flipkart', price: 28999, url: 'https://flipkart.com/sony-wh-1000xm5', availability: true, rating: 4.8 }
    ],
    lowestPrice: 28999,
    highestPrice: 29900
  }
];

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Search products
app.get('/api/products/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query required' });
    
    let products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });
    
    // If no products, seed sample data
    if (products.length === 0) {
      const existing = await Product.findOne({ name: sampleProducts[0].name });
      if (!existing) {
        for (const p of sampleProducts) {
          await new Product(p).save();
        }
        products = await Product.find({
          name: { $regex: query, $options: 'i' }
        });
      }
    }
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending products
app.get('/api/products/trending', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(10);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh product prices
app.post('/api/products/:id/refresh', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    // Update prices randomly (simulate real changes)
    product.sources = product.sources.map(s => ({
      ...s,
      price: Math.round(s.price + (Math.random() * 2000 - 1000)),
      lastChecked: new Date()
    }));
    
    product.lowestPrice = Math.min(...product.sources.map(s => s.price));
    product.highestPrice = Math.max(...product.sources.map(s => s.price));
    product.updatedAt = new Date();
    
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed products route (for testing)
app.post('/api/products/seed', async (req, res) => {
  try {
    await Product.deleteMany({});
    for (const p of sampleProducts) {
      await new Product(p).save();
    }
    res.json({ message: 'Products seeded successfully!', count: sampleProducts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
