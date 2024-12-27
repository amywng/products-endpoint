const express = require('express');
const app = express();
const port = 3000;
const products = require('./data.json');

const maxRequests = 256;
const resetTime = 15000;
const sortParams = ["name", "price", "stars"]
const allCats = ["electronics", "apparel", "home goods", "sports", "beauty", "grocery", 
  "office supplies", "outdoor", "toys", "health", "automotive", "luxury", "books"]

app.set('maxRequests', maxRequests);

let requestCount = 0;
const intervalId = setInterval(() => {
    requestCount = 0;
}, resetTime);

app.get('/health', (req, res) => {
    res.status(200).json({ msg: "healthy" });
});

const filterProducts = (products, filters) => {
  return products.filter(product => {
    if (filters.categories && !filters.categories.some(cat => product.categories.includes(cat))) {
      return false;
    }

    if ((filters.minPrice && product.price < filters.minPrice)
        || (filters.maxPrice && product.price > filters.maxPrice)
        || (filters.minStars && product.stars < filters.minStars)
        || (filters.maxStars && product.stars > filters.maxStars)) {
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

const parseQueryParams = (req) => {
    const { categories, limit, offset, order, price_max, price_min, sort, star_max, star_min } = req.query;
    const categoryList = categories ? categories.split(',').map(cat => decodeURIComponent(cat.replace(/%20/g, ' '))) : null;

    return {
        categories: categoryList,
        limit: limit ? parseInt(limit) : 3,
        offset: offset ? parseInt(offset) : 0,
        order: order || 'asc',
        minPrice: price_min,
        maxPrice: price_max,
        sort: sort ? sort : 'name',
        minStars: star_min,
        maxStars: star_max,
    }
}

const validateQueryParams = (filters) => {
    if (filters.limit < 0 || filters.offset < 0) return false;
    if (filters.categories && filters.categories.some(cat => !allCats.includes(cat))) return false;
    if (filters.minPrice && !/^\d+$/.test(filters.minPrice)) return false;
    filters.minPrice = parseInt(filters.minPrice);
    if (filters.maxPrice && !/^\d+$/.test(filters.maxPrice)) return false;
    filters.maxPrice = parseInt(filters.maxPrice);
    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) return false;
    if (filters.minStars && filters.maxStars && filters.minStars > filters.maxStars) return false;
    if (filters.minStars && !/^\d+$/.test(filters.minStars)) return false;
    filters.minStars = parseInt(filters.minStars);
    if (filters.maxStars && !/^\d+$/.test(filters.maxStars)) return false;
    filters.maxStars = parseInt(filters.maxStars);
    if (filters.order && !["asc", "desc"].includes(filters.order)) return false;
    if (filters.sort && !sortParams.includes(filters.sort)) return false;
    return true;
}

app.get('/api/v1/products', (req, res) => {
  // console.log("Q:"+JSON.stringify(req.query, null, 2));
  console.log('http:://localhost:3000' + req.originalUrl);
  requestCount++;
  if (requestCount > maxRequests) {
    return res.status(429).json({
      msg: "Too many requests",
      statusCode: 429
    });
  }

  const filters = parseQueryParams(req);

  if (!validateQueryParams(filters)) {
    return res.status(400).json({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  }

  let filteredProducts = filterProducts(products, filters);
  if (filters.sort) {
    filteredProducts = sortProducts(filteredProducts, filters.sort, filters.order);
  }

  const start = filters.offset * filters.limit;
  const end = start + filters.limit;
  filteredProducts = filteredProducts.slice(start, end);
  
  res.status(200).json(filteredProducts);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    msg: "Internal server error",
    statusCode: 500
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
});

module.exports = { app, server, intervalId };