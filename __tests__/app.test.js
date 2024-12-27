const request = require('supertest');
const { app, server, intervalId } = require('../app');
const apiURL = "/api/v1/products"

afterAll(() => {
  clearInterval(intervalId);
  server.close();
})

describe('Test /health', () => {
  it('GET /health should respond with healthy message', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ msg: "healthy" });
  })
})

describe('Test valid category inputs to /products', () => {
  it('products endpoint no params', async () => {
    const response = await request(app).get(apiURL);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);
  })

  it('one category filters correctly', async () => {
    const response = await request(app).get(`${apiURL}?categories=electronics`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => product.categories.includes('electronics'))).toBe(true);
  })

  it('two categories filters correctly', async () => {
    const response = await request(app).get
      (`${apiURL}?categories=electronics,sports`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => 
      (product.categories.includes('electronics') || product.categories.includes('sports')))).toBe(true);
  })

  it('three categories, one with space, filters correctly', async () => {
    const response = await request(app).get
      (`${apiURL}?categories=electronics,sports,home%20goods`);
    expect(response.statusCode).toBe(200);
    expect(response.body.every(product => 
      (product.categories.includes('electronics') 
      || product.categories.includes('sports')
      || product.categories.includes('home goods')))).toBe(true);
  })
})

describe('Test price & stars inputs to /products', () => {
  it('should apply price min and max filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=50&price_max=200`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price >= 50 && product.price <= 200)
    ).toBe(true);
  });

  it('test same num stars', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=100&star_max=100`
    )

    expect(response.status).toBe(200);
    expect(
      response.body.every(product => product.stars === 200)
    ).toBe(true);
  })

  it('test same num price', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=100&price_max=100`
    )

    expect(response.status).toBe(200);
    expect(
      response.body.every(product => product.price === 200)
    ).toBe(true);
  })

  it('should apply price min filter correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=123400`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price >= 123400)
    ).toBe(true);
  });

  it('should apply price max filter correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?price_max=15340`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.price <= 15340)
    ).toBe(true);
  });

  it('should apply star min and max filters correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=120&star_max=380`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars >= 120 && product.stars <= 380)
    ).toBe(true);
  });

  it('should apply star min filter correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=400`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars >= 400)
    ).toBe(true);
  });

  it('should apply star max filter correctly', async () => {
    const response = await request(app).get(
      `${apiURL}?star_max=200`
    );
    expect(response.statusCode).toBe(200);
    expect(
      response.body.every(product => product.stars <= 200)
    ).toBe(true);
  });
})

describe('Test sorting', () => {
  it('test default sorting', async () => {
    const response = await request(app).get(
      apiURL
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => a.name.localeCompare(b.name));

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test names sorting (default asc)', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=name`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => a.name.localeCompare(b.name));

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test names sorting desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=name&order=desc`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => b.name.localeCompare(a.name));

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test price sorting desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=price&order=desc`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => b.price - a.name);

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test price sorting asc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=price&order=asc`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => a.price - b.name);

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test stars sorting desc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=stars&order=desc`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => b.stars - a.stars);

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })

  it('test stars sorting asc', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=stars&order=desc`
    );
    const products = response.body;
    const sortedProducts = products.sort((a,b) => a.stars - b.stars);

    expect(response.status).toBe(200);
    expect(products).toEqual(sortedProducts);
  })
})

describe('Test limit and offset', () => {
  it('test small limit', async () => {
    const response = await request(app).get(
      `${apiURL}?limit=2`
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeLessThanOrEqual(2);
  })

  it('test offset with default limit (3)', async () => {
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

  it('test offset with set limit', async () => {
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

  it('test default offset and limit', async () => {
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

describe('Test request limit', () => {
  it.skip('test limit', async () => {
    for (let i=0;i<app.get('maxRequests'); i++) {
      const response = await request(app).get(apiURL);

      expect(response.status).toBe(200);
    }
    const lastResponse = await request(app).get(apiURL)
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body).toStrictEqual({ msg: "Too many requests", statusCode: 429 });
  })
})

describe('Test invalid params', () => {
  it('test invalid category', async () => {
    const response = await request(app).get(
      `${apiURL}?categories=jewelry`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid category with multiple categories', async () => {
    const response = await request(app).get(
      `${apiURL}?categories=sports,jewelry`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid sort', async () => {
    const response = await request(app).get(
      `${apiURL}?sort=random`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid offset', async () => {
    const response = await request(app).get(
      `${apiURL}?offset=-1`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid limit', async () => {
    const response = await request(app).get(
      `${apiURL}?limit=-1`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid order', async () => {
    const response = await request(app).get(
      `${apiURL}?order=dasc`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid min price', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid max price', async () => {
    const response = await request(app).get(
      `${apiURL}?price_max=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid price relation', async () => {
    const response = await request(app).get(
      `${apiURL}?price_min=200&price_max=100`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid min stars', async () => {
    const response = await request(app).get(
      `${apiURL}?star_min=200.00`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid max stars', async () => {
    const response = await request(app).get(
      `${apiURL}?star_max=200.34`
    )

    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({
      msg: "Invalid query parameters or request data",
      statusCode: 400
    });
  })

  it('test invalid stars relation', async () => {
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