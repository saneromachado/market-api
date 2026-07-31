import { expect, test } from '@playwright/test';

import { bearer, loginAsAdmin } from './helpers';

test.describe('Fluxo completo do mercado', () => {
  test('cadastra, abastece, vende e cancela uma venda', async ({ request }) => {
    const token = await loginAsAdmin(request);
    const headers = bearer(token);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let productId = '';

    await test.step('cadastrar categoria e produto', async () => {
      const categoryResponse = await request.post('categories', {
        headers,
        data: { name: `Bebidas ${unique}`, description: 'Criada pelo Playwright' },
      });
      expect(categoryResponse.status()).toBe(201);
      const category = await categoryResponse.json();

      const productResponse = await request.post('products', {
        headers,
        data: {
          name: `Suco de uva ${unique}`,
          sku: `SKU-${unique}`,
          barcode: `789${Date.now()}`,
          price: 12.5,
          minimumStock: 3,
          categoryId: category.id,
        },
      });
      expect(productResponse.status()).toBe(201);
      const product = await productResponse.json();
      productId = product.id;
      expect(product.stock).toBe(0);

      const duplicateResponse = await request.post('products', {
        headers,
        data: {
          name: 'Produto duplicado',
          sku: product.sku,
          barcode: `790${Date.now()}`,
          price: 1,
          minimumStock: 0,
          categoryId: category.id,
        },
      });
      expect(duplicateResponse.status()).toBe(409);
    });

    await test.step('dar entrada de dez unidades', async () => {
      const response = await request.post('inventory/movements', {
        headers,
        data: {
          productId,
          type: 'ENTRY',
          quantity: 10,
          reason: 'Compra do fornecedor',
        },
      });
      const movement = await response.json();

      expect(response.status()).toBe(201);
      expect(movement).toMatchObject({
        previousStock: 0,
        currentStock: 10,
        quantity: 10,
      });
    });

    await test.step('impedir venda acima do estoque', async () => {
      const response = await request.post('sales', {
        headers,
        data: {
          paymentMethod: 'PIX',
          items: [{ productId, quantity: 11 }],
        },
      });

      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        message: expect.stringContaining('Estoque insuficiente'),
      });
    });

    let saleId = '';
    await test.step('vender duas unidades e baixar o estoque', async () => {
      const response = await request.post('sales', {
        headers,
        data: {
          paymentMethod: 'PIX',
          discount: 2,
          items: [{ productId, quantity: 2 }],
        },
      });
      const sale = await response.json();
      saleId = sale.id;

      expect(response.status()).toBe(201);
      expect(sale).toMatchObject({
        status: 'COMPLETED',
        subtotal: '25',
        discount: '2',
        total: '23',
      });

      const productResponse = await request.get(`products/${productId}`, {
        headers,
      });
      await expect(productResponse.json()).resolves.toMatchObject({ stock: 8 });
    });

    await test.step('cancelar idempotentemente e devolver o estoque', async () => {
      const first = await request.post(`sales/${saleId}/cancel`, { headers });
      expect(first.status()).toBe(201);
      await expect(first.json()).resolves.toMatchObject({ status: 'CANCELLED' });

      const second = await request.post(`sales/${saleId}/cancel`, { headers });
      expect(second.status()).toBe(201);

      const productResponse = await request.get(`products/${productId}`, {
        headers,
      });
      await expect(productResponse.json()).resolves.toMatchObject({ stock: 10 });
    });
  });
});
