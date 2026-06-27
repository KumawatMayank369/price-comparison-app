import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  AppBar, Toolbar, Typography, Container, Box, 
  TextField, Button, Card, CardContent, CardMedia,
  Grid, Chip, Tab, Tabs, Paper, CircularProgress,
  Divider, LinearProgress
} from '@mui/material';
import { Search, Refresh, CompareArrows, TrendingUp, Star } from '@mui/icons-material';

// API Configuration
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://your-backend.vercel.app/api'
  : 'http://localhost:5000/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/trending`);
      setTrending(response.data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/search?query=${encodeURIComponent(searchQuery)}`);
      setProducts(response.data);
      setTabValue(0);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (productId) => {
    try {
      await axios.post(`${API_URL}/products/${productId}/refresh`);
      if (searchQuery) {
        const response = await axios.get(`${API_URL}/products/search?query=${searchQuery}`);
        setProducts(response.data);
      } else {
        fetchTrending();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const getBestPrice = (sources) => {
    if (!sources || sources.length === 0) return null;
    return Math.min(...sources.map(s => s.price));
  };

  const getCheapestRetailer = (sources) => {
    if (!sources || sources.length === 0) return null;
    return sources.reduce((min, s) => s.price < min.price ? s : min);
  };

  const getPriceDifference = (sources) => {
    if (!sources || sources.length < 2) return null;
    const prices = sources.map(s => s.price);
    const diff = Math.max(...prices) - Math.min(...prices);
    return diff;
  };

  return (
    <BrowserRouter>
      <AppBar position="sticky" color="primary" sx={{ bgcolor: '#1565C0' }}>
        <Toolbar>
          <CompareArrows sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            PricePulse
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Search Bar */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSearch}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                fullWidth
                placeholder="Search products (e.g., iPhone 15, Samsung S24, MacBook)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="large"
                sx={{ flex: 1, minWidth: '200px' }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                sx={{ minWidth: '120px' }}
              >
                {loading ? 'Searching...' : 'Compare'}
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`🔍 Results (${products.length})`} />
            <Tab label={`🔥 Trending (${trending.length})`} icon={<TrendingUp />} />
          </Tabs>
        </Box>

        {/* Product Grid */}
        <Grid container spacing={3}>
          {(tabValue === 0 ? products : trending).map((product) => (
            <Grid item xs={12} md={6} key={product._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  sx={{ objectFit: 'contain', p: 2, bgcolor: '#fafafa' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap title={product.name}>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {product.sources?.map((source, idx) => (
                      <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Chip 
                          label={source.retailer} 
                          size="small" 
                          color={source.retailer === 'Amazon' ? 'warning' : 'info'}
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h6" color="primary">
                            ₹{source.price?.toLocaleString()}
                          </Typography>
                          {source.rating && (
                            <Chip 
                              icon={<Star sx={{ fontSize: 14 }} />}
                              label={source.rating} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {product.sources && product.sources.length > 1 && (
                    <>
                      <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.main">
                          🏆 Best: ₹{getBestPrice(product.sources)?.toLocaleString()} at {getCheapestRetailer(product.sources)?.retailer}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          💰 Savings: ₹{getPriceDifference(product.sources)?.toLocaleString()} difference
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Box display="flex" gap={1} sx={{ mt: 2 }} flexWrap="wrap">
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => handleRefresh(product._id)}
                    >
                      Refresh
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      component={Link}
                      to={`/product/${product._id}`}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {tabValue === 0 && products.length === 0 && !loading && (
          <Box textAlign="center" sx={{ py: 8 }}>
            <Typography variant="h5" color="text.secondary">
              🔍 Search for products to compare
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try: iPhone, Samsung, MacBook, Sony Headphones
            </Typography>
          </Box>
        )}
      </Container>

      <Routes>
        <Route path="/product/:id" element={<ProductDetail API_URL={API_URL} />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==================== PRODUCT DETAIL PAGE ====================

function ProductDetail({ API_URL }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await axios.post(`${API_URL}/products/${id}/refresh`);
      fetchProduct();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading product details...</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Product not found</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} to="/" startIcon={<span>←</span>} sx={{ mb: 2 }}>
        Back to Search
      </Button>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              bgcolor: '#fafafa', 
              borderRadius: 2, 
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300
            }}>
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'} 
                alt={product.name}
                style={{ 
                  width: '100%', 
                  maxHeight: 400, 
                  objectFit: 'contain' 
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              💰 Price Comparison
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {product.sources?.map((source, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Card variant="outlined" sx={{ 
                    borderColor: source.retailer === 'Amazon' ? '#FF9900' : '#2874F0',
                    borderWidth: 2
                  }}>
                    <CardContent>
                      <Chip 
                        label={source.retailer} 
                        color={source.retailer === 'Amazon' ? 'warning' : 'info'}
                        size="large"
                      />
                      <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                        ₹{source.price?.toLocaleString()}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {source.availability ? '✅ In Stock' : '❌ Out of Stock'}
                        </Typography>
                        {source.rating && (
                          <Chip 
                            icon={<Star sx={{ fontSize: 16 }} />}
                            label={`${source.rating} ★`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        href={source.url} 
                        target="_blank"
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        View on {source.retailer}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box display="flex" gap={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                startIcon={<Refresh />}
                onClick={handleRefresh}
              >
                Refresh Prices
              </Button>
              <Button 
                variant="outlined" 
                component={Link}
                to="/"
              >
                Compare More
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default App;
