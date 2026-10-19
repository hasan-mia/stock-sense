'use strict';

const { faker } = require('@faker-js/faker');

faker.seed(20261018);

const categories = ['Beverages', 'Pantry', 'Personal Care', 'Household'];

const staff = [1, 2].map((number) => ({
  name: faker.person.fullName(),
  email: `staff${number}@stocksense.com`,
}));

const supplierEmails = [
  'orders@dhakawholesale.com',
  'sales@freshroute.com',
  'contact@dailyessentials.com',
];

const suppliers = supplierEmails.map((email) => ({
  name: faker.company.name(),
  phone: `+8801${faker.string.numeric(9)}`,
  email,
}));

const stockLevels = [8, 32, 14, 6, 24, 5, 18, 11, 19, 7, 26, 9];
const reorderLevels = [10, 12, 8, 10, 10, 12, 8, 8, 10, 10, 12, 8];

const products = Array.from({ length: 12 }, (_, index) => ({
  sku: `DEMO-SKU-${String(index + 1).padStart(3, '0')}`,
  name: `${faker.commerce.productName()} ${faker.helpers.arrayElement(['250g', '500g', '1kg', '1L'])}`,
  price: faker.number.float({ min: 1.25, max: 45, fractionDigits: 2 }).toFixed(2),
  finalStock: stockLevels[index],
  reorderLevel: reorderLevels[index],
  category: categories[index % categories.length],
  supplier: suppliers[index % suppliers.length].email,
}));

const sales = Array.from({ length: 24 }, (_, index) => {
  const reference = `DEMO-FK-2026-${String(index + 1).padStart(3, '0')}`;
  const date = faker.date.between({
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-09-30T23:59:59.999Z',
  });
  const items = faker.helpers.arrayElements(products, 3).map((product) => ({
    sku: product.sku,
    quantity: faker.number.int({ min: 1, max: 5 }),
    unitPrice: product.price,
  }));
  return { reference, date, items };
});

module.exports = { categories, staff, suppliers, products, sales };
