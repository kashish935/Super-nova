const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Create mock adapter
const mock = new MockAdapter(axios);

// Mock cart service responses
mock.onGet('http://nova-ALB-1465556720.us-east-1.elb.amazonaws.com/api/cart').reply(() => {
    return [200, {
        cart: {
            items: [
                {
                    productId: '507f1f77bcf86cd799439011',
                    quantity: 2,
                },
                {
                    productId: '507f1f77bcf86cd799439012',
                    quantity: 1,
                },
            ],
        },
    }];
});

// Mock product service responses
mock.onGet(/http:\/\/localhost:3001\/api\/products\/.*/).reply((config) => {
    const productId = config.url.split('/').pop();
    
    const products = {
        '507f1f77bcf86cd799439011': {
            _id: '507f1f77bcf86cd799439011',
            title: 'Product 1',
            stock: 100,
            price: {
                amount: 500,
                currency: 'INR',
            },
        },
        '507f1f77bcf86cd799439012': {
            _id: '507f1f77bcf86cd799439012',
            title: 'Product 2',
            stock: 50,
            price: {
                amount: 300,
                currency: 'INR',
            },
        },
    };

    const product = products[productId];
    if (product) {
        return [200, { data: product }];
    }
    return [404, { message: 'Product not found' }];
});
