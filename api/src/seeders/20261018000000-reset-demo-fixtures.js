'use strict';

const { Op } = require('sequelize');

module.exports = {
  async up() {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Demo seed data is disabled in production.');
    const { Product, Sale, SaleItem, StockMovement, sequelize } = require('../models');
    const legacySkus = [
      'BEV-COF-001',
      'BEV-TEA-001',
      'PAN-RIC-001',
      'PAN-OIL-001',
      'PAN-LEN-001',
      'CARE-SOAP-001',
      'CARE-PASTE-001',
      'HOME-DETER-001',
    ];
    const legacyRefs = ['DEMO-2026-001', 'DEMO-2026-002', 'DEMO-2026-003'];
    await sequelize.transaction(async (transaction) => {
      const sales = await Sale.findAll({
        where: {
          [Op.or]: [
            { reference: { [Op.in]: legacyRefs } },
            { reference: { [Op.like]: 'DEMO-FK-2026-%' } },
          ],
        },
        attributes: ['id'],
        transaction,
      });
      const saleIds = sales.map(({ id }) => id);
      const products = await Product.findAll({
        where: {
          [Op.or]: [{ sku: { [Op.in]: legacySkus } }, { sku: { [Op.like]: 'DEMO-SKU-%' } }],
        },
        attributes: ['id', 'sku'],
        transaction,
      });
      const productIds = products.map(({ id }) => id);

      if (productIds.length) {
        const referencedSaleItems = await SaleItem.findAll({
          where: { productId: { [Op.in]: productIds } },
          attributes: ['saleId'],
          transaction,
        });
        if (referencedSaleItems.some(({ saleId }) => !saleIds.includes(saleId))) {
          throw new Error('Demo SKU has non-demo sale history; refusing to reset seeded products.');
        }

        const movements = await StockMovement.findAll({
          where: { productId: { [Op.in]: productIds } },
          attributes: ['saleId', 'reason'],
          transaction,
        });
        if (
          movements.some(
            ({ saleId, reason }) =>
              reason !== 'initial_stock' && (!saleId || !saleIds.includes(saleId)),
          )
        ) {
          throw new Error(
            'Demo SKU has non-demo stock history; refusing to reset seeded products.',
          );
        }
      }

      if (saleIds.length) {
        await StockMovement.destroy({ where: { saleId: { [Op.in]: saleIds } }, transaction });
        await SaleItem.destroy({ where: { saleId: { [Op.in]: saleIds } }, transaction });
        await Sale.destroy({ where: { id: { [Op.in]: saleIds } }, transaction });
      }
      if (productIds.length) {
        await StockMovement.destroy({ where: { productId: { [Op.in]: productIds } }, transaction });
        await Product.destroy({ where: { id: { [Op.in]: productIds } }, transaction });
      }
    });
  },
};
