const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/models/cart.model.js', () => {
    function mockGenerateObjectId() {
        return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const carts = new Map();

    class CartMock {
        constructor({ user, items }) {
            this._id = mockGenerateObjectId();
            this.user = user;
            this.items = items || [];
        }

        static async findOne(query) {
            return carts.get(query.user) || null;
        }

        static async deleteOne(query) {
            const existed = carts.get(query.user);
            if (existed) {
                carts.delete(query.user);
                return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
        }

        async save() {
            carts.set(this.user, this);
            return this;
        }
    }

    CartMock.__reset = () => carts.clear();
    return CartMock;
});

const CartModel = require('../src/models/cart.model.js');

function generateObjectId() {
    return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const postEndpoint = '/api/cart/items';
const deleteItemEndpoint = '/api/cart/items';
const clearCartEndpoint = '/api/cart';
const getEndpoint = '/api/cart';

describe('DELETE cart endpoints', () => {
    const userId = generateObjectId();
    const productId = generateObjectId();
    const otherProductId = generateObjectId();

    beforeEach(() => {
        CartModel.__reset();
    });

    test('removes an existing item from the cart', async () => {
        const token = signToken({ id: userId, role: 'user' });

        await request(app)
            .post(postEndpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId, qty: 2 });

        const res = await request(app)
            .delete(`${deleteItemEndpoint}/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Item removed from cart');
        expect(res.body.cart.items).toHaveLength(0);
    });

    test('returns 404 when the cart does not exist', async () => {
        const token = signToken({ id: userId, role: 'user' });

        const res = await request(app)
            .delete(`${deleteItemEndpoint}/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Cart not found');
    });

    test('returns 404 when the item is not present in the cart', async () => {
        const token = signToken({ id: userId, role: 'user' });

        await request(app)
            .post(postEndpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: otherProductId, qty: 1 });

        const res = await request(app)
            .delete(`${deleteItemEndpoint}/${productId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Item not found');
    });

    test('clears all items from the cart', async () => {
        const token = signToken({ id: userId, role: 'user' });

        await request(app)
            .post(postEndpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId, qty: 2 });

        await request(app)
            .post(postEndpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: otherProductId, qty: 3 });

        const res = await request(app)
            .delete(clearCartEndpoint)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cart cleared');

        const followUp = await request(app)
            .get(getEndpoint)
            .set('Authorization', `Bearer ${token}`);

        expect(followUp.status).toBe(200);
        expect(followUp.body.cart.items).toHaveLength(0);
        expect(followUp.body.totals).toMatchObject({ itemCount: 0, totalQuantity: 0 });
    });

    test('requires authentication for deleting an item', async () => {
        const res = await request(app).delete(`${deleteItemEndpoint}/${productId}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });

    test('requires authentication for clearing the cart', async () => {
        const res = await request(app).delete(clearCartEndpoint);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/);
    });
});
