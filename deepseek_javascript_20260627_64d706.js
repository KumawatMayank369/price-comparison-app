import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AppBar, Toolbar, Typography, Container, Box, 
  TextField, Button, Card, CardContent, CardMedia,
  Grid, Chip, IconButton, Tab, Tabs, Paper, CircularProgress
} from '@mui/material';
import { Search, Refresh, CompareArrows, TrendingUp } from '@mui/icons-material';
import ProductDetail from './components/ProductDetail';
import PriceChart from './components/PriceChart';
import { API_URL } from './config';

// Axios default config
axios.defaults.baseURL = API_URL;

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await axios.get('/products/trending');
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
      const response = await axios.get(`/products/search?query=${encodeURIComponent(searchQuery)}`);
      setProducts(response.data);
      setTabValue(0);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (productId) => {
    try {
      await axios.post(`/products/${productId}/refresh`);
      // Refresh the list
      if (searchQuery) {
        const response = await axios.get(`/products/search?query=${searchQuery}`);
        setProducts(response.data);
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

  return (
    <BrowserRouter>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <CompareArrows sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }} component={Link} to="/" style={{ textDecoration: 'none', color: 'white' }}>
            PricePulse 📊
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
                placeholder="Search for products (e.g., iPhone 15, Samsung S24, MacBook)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="large"
                sx={{ flex: 1 }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
              >
                {loading ? 'Searching...' : 'Compare'}
              </Button>
            </Box>
          </form>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="🔍 Search Results" />
            <Tab label="🔥 Trending" icon={<TrendingUp />} />
          </Tabs>
        </Box>

        {/* Product Grid */}
        <Grid container spacing={3}>
          {(tabValue === 0 ? products : trending).map((product) => (
            <Grid item xs={12} md={6} key={product._id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  sx={{ objectFit: 'contain', p: 2, bgcolor: '#f5f5f5' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap title={product.name}>
                    {product.name}
                  </Typography>
                  
                  {/* Price Comparison */}
                  <Box sx={{ mt: 2 }}>
                    {product.sources?.map((source, idx) => (
                      <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Chip 
                          label={source.retailer} 
                          size="small" 
                          color={source.retailer === 'Amazon' ? 'warning' : 'info'}
                        />
                        <Typography variant="h6" color="primary">
                          ₹{source.price.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Best Price Indicator */}
                  {product.sources && product.sources.length > 1 && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.main">
                        🏆 Best Price: ₹{getBestPrice(product.sources)?.toLocaleString()} 
                        at {getCheapestRetailer(product.sources)?.retailer}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
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
              🔍 Search for products to compare prices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching for popular items like iPhone, Samsung, Laptops, etc.
            </Typography>
          </Box>
        )}
      </Container>

      <Routes>
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;