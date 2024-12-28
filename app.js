const express = require('express');
const app = express();
const port = 3000;
const products = require('./data.json');

const maxRequests = 256;
const resetTime = 15000;
const allSorts = ['name', 'price', 'stars']
const allCats = ['electronics', 'apparel', 'home goods', 'sports', 'beauty', 'grocery', 
  'office supplies', 'outdoor', 'toys', 'health', 'automotive', 'luxury', 'books']

app.set('maxRequests', maxRequests);

let requestCount = 0;
const intervalId = setInterval(() => {
    requestCount = 0;
}, resetTime);

app.get('/health', (req, res) => {
    res.status(200).json({ msg: 'healthy' });
});

const filterProducts = (products, filters) => {
  return products.filter(product => {
    // by category
    if (!filters.categories.some(cat => product.categories.includes(cat))) {
      return false;
    }

    // by price constraints
    if ((product.price < filters.minPrice) || (product.price > filters.maxPrice)) {
        return false;
    }

    // by star constraints
    if ((product.stars < filters.minStars) || (product.stars > filters.maxStars)) {
        return false;
    }

    return true;
  });
};

const sortProducts = (products, sortBy, order) => {
    const compare = (a, b, field) => {
        if (field === 'price' || field === 'stars') {
            return order === 'asc' ? a[field] - b[field] : b[field] - a[field];
        }
        return order === 'asc' ? a[field].localeCompare(b[field]) : b[field].localeCompare(a[field]);
    }
    return products.sort((a,b) => compare(a,b,sortBy))
};

const testInteger = (string) => /^\d+$/.test(string);

const parseQueryParams = (req) => {
    const { categories, limit, offset, order, price_max, price_min, sort, star_max, star_min } = req.query;
    const categoryList = categories ? categories.split(',').map(cat => decodeURIComponent(cat.replace(/%20/g, ' '))) : null;

    return {
        categories: categoryList || allCats,
        limit: limit ? parseInt(limit) : 3,
        offset: offset ? parseInt(offset) : 0,
        order: order || 'asc',
        minPrice: price_min || '0',
        maxPrice: price_max || '4294967295',
        sort: sort || 'name',
        minStars: star_min || '0',
        maxStars: star_max || '500',
    }
}

const validateQueryParams = (filters) => {
    // limit and offset validation
    if (filters.limit < 0 || filters.offset < 0) return false;
    
    // category validation
    if (filters.categories && filters.categories.some(cat => !allCats.includes(cat))) return false;

    // price constraints validation & parsing
    if (!testInteger(filters.minPrice)) return false;
    if (!testInteger(filters.maxPrice)) return false;

    filters.minPrice = parseInt(filters.minPrice);
    filters.maxPrice = parseInt(filters.maxPrice);

    if (filters.minPrice > filters.maxPrice) return false;

    // star constraints validation & parsing
    if (!testInteger(filters.minStars)) return false;
    if (!testInteger(filters.maxStars)) return false;

    filters.minStars = parseInt(filters.minStars);
    filters.maxStars = parseInt(filters.maxStars);

    if (filters.minStars > filters.maxStars) return false;

    // order and sort validation
    if (!['asc', 'desc'].includes(filters.order)) return false;
    if (!allSorts.includes(filters.sort)) return false;

    return true;
}

app.get('/api/v1/products', (req, res) => {
  requestCount++;
  if (requestCount > maxRequests) {
    return res.status(429).json({
      msg: 'Too many requests',
      statusCode: 429
    });
  }

  const filters = parseQueryParams(req);

  if (!validateQueryParams(filters)) {
    return res.status(400).json({
      msg: 'Invalid query parameters or request data',
      statusCode: 400
    });
  }

  let filteredProducts = filterProducts(products, filters);
  
  filteredProducts = sortProducts(filteredProducts, filters.sort, filters.order);

  const start = filters.offset * filters.limit;
  const end = start + filters.limit;
  filteredProducts = filteredProducts.slice(start, end);
  
  res.status(200).json(filteredProducts);
});

app.use((err, res) => {
  console.error(err.stack);
  res.status(500).json({
    msg: 'Internal server error',
    statusCode: 500
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app, server, intervalId };