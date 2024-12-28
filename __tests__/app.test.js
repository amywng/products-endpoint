const request = require('supertest');
const { app, server, intervalId } = require('../app');
const apiURL = "/api/v1/products"

afterAll(() => {
  clearInterval(intervalId);
  server.close();
})

describe('GET /health', () => {
  it('responds with healthy message', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ msg: "healthy" });
  })
})

describe('GET /products', () => {
  it('no query params responds with array of 3 products', async () => {
    const response = await request(app).get(apiURL);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);
  })
})

describe('GET /products with category params', () => {
  it('one category filters correctly', async () => {
    const response = await request(app).get(`${apiURL}?categories=electronics`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => product.categories.includes('electronics'))).toBe(true);
  })

  it('two categories filter correctly', async () => {
    const response = await request(app).get
      (`${apiURL}?categories=electronics,sports`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => 
      (product.categories.includes('electronics') || product.categories.includes('sports')))).toBe(true);
  })

  it('three categories, one with space, filter correctly', async () => {
    const response = await request(app).get
      (`${apiURL}?categories=electronics,sports,home%20goods`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => 
      (product.categories.includes('electronics') 
      || product.categories.includes('sports')
      || product.categories.includes('home goods')))).toBe(true);
  })
})

describe('GET /products price and star constraint params', () => {
  it('given both price min and max, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=50&price_max=200`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price >= 50 && product.price <= 200)
    ).toBe(true);
  });

  it('given just price min, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=123400`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price >= 123400)
    ).toBe(true);
  });

  it('given just price max, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_max=15340`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price <= 15340)
    ).toBe(true);
  });

  it('given both star min and max, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=120&star_max=380`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars >= 120 && product.stars <= 380)
    ).toBe(true);
  });

  it('given just star min, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=400`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars >= 400)
    ).toBe(true);
  });

  it('given just star max, filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_max=200`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars <= 200)
    ).toBe(true);
  });

  it('given same star min and max, returns only products with exact star amount', async () => {
    const stars = 500;
    const response = await request(app).get(
      `${apiURL}?star_min=${stars}&star_max=${stars}`
    )

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every(product => product.stars === stars)
    ).toBe(true);
  })

  it('given same price min and max, returns only products with exact price amount', async () => {
    const price = 900000;
    const response = await request(app).get(
      `${apiURL}?price_min=${price}&price_max=${price}`
    )

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every(product => product.price === price)
    ).toBe(true);
  })
})

describe('GET /products sorting', () => {
  it('default sorting (name asc)', async () => {
    const response = await request(app).get(
      apiURL
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => a.name.localeCompare(b.name)));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('name sorting (with default asc)', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=name`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => a.name.localeCompare(b.name)));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('name desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=name&order=desc`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => b.name.localeCompare(a.name)));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('price desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=price&order=desc`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => b.price - a.name));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('price asc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=price&order=asc`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => a.price - b.name));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('stars desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=stars&order=desc`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => b.stars - a.stars));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })

  it('stars asc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=stars&order=asc`
    );
    const products = response.body;
    const unsortedProducts = JSON.stringify(products);
    const sortedProducts = JSON.stringify(products.sort((a,b) => a.stars - b.stars));

    expect(response.status).toBe(200);
    expect(unsortedProducts).toEqual(sortedProducts);
  })
})

describe('GET /products limit and offset', () => {
  it('small limit', async () => {
    const response = await request(app).get(
      `${apiURL}?limit=2`
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeLessThanOrEqual(2);
  })

  it('offset with default limit 3', async () => {
    const response1 = await request(app).get(
      `${apiURL}?categories=electronics&limit=15`
    );

    const response2 = await request(app).get(
      `${apiURL}?categories=electronics&offset=2`
    )

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.body.slice(6,9)).toEqual(response2.body);
  })

  it('offset with limit 2', async () => {
    const response1 = await request(app).get(
      `${apiURL}?categories=home%20goods&limit=15`
    );

    const response2 = await request(app).get(
      `${apiURL}?categories=home%20goods&offset=1&limit=2`
    )

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.body.slice(2,4)).toEqual(response2.body);
  })

  it('default offset and limit', async () => {
    const response1 = await request(app).get(
      `${apiURL}?categories=beauty`
    );

    const response2 = await request(app).get(
      `${apiURL}?categories=beauty&offset=0&limit=3`
    )

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.body.slice(0,3)).toEqual(response2.body);
  })
})

describe('GET /products max requests', () => {
  it.skip('request limit', async () => {
    for (let i=0;i<app.get('maxRequests'); i++) {
      const response = await request(app).get(apiURL);

      expect(response.status).toBe(200);
    }
    const lastResponse = await request(app).get(apiURL)
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toStrictEqual({ msg: "Too many requests", statusCode: 429 });
  })
})

describe('GET /products invalid params', () => {
  it('invalid category', async () => {
    const response = await request(app).get(
      `${apiURL}?categories=jewelry`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid category with multiple given categories', async () => {
    const response = await request(app).get(
      `${apiURL}?categories=sports,jewelry`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid sort', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=random`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid offset', async () => {
    const response = await request(app).get(
      `${apiURL}?offset=-1`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid limit', async () => {
    const response = await request(app).get(
      `${apiURL}?limit=-1`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid order', async () => {
    const response = await request(app).get(
      `${apiURL}?order=dasc`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid min price', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid max price', async () => {
    const response = await request(app).get(
      `${apiURL}?price_max=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid price relation', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=200&price_max=100`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid min stars', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid max stars', async () => {
    const response = await request(app).get(
      `${apiURL}?star_max=200.34`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('invalid stars relation', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=200&star_max=100`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })
})