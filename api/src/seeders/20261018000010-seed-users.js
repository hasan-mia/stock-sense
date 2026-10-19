'use strict';

const { staff } = require('../utils/demoData');

module.exports = {
  async up() {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Demo seed data is disabled in production.');
    const { User, sequelize } = require('../models');
    const name = process.env.ADMIN_SEED_NAME;
    const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_SEED_PASSWORD;
    if (!name || !email || !password) {
      throw new Error(
        'Set ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD before seeding.',
      );
    }

    await sequelize.transaction(async (transaction) => {
      const [admin, adminCreated] = await User.findOrCreate({
        where: { email },
        defaults: { name: name.trim(), email, password, role: 'admin' },
        transaction,
      });
      if (!adminCreated) {
        await admin.update({ name: name.trim(), password, role: 'admin' }, { transaction });
      }

      if (!process.env.STAFF_SEED_PASSWORD) return;
      for (const demoStaff of staff) {
        const [user, created] = await User.findOrCreate({
          where: { email: demoStaff.email },
          defaults: { ...demoStaff, password: process.env.STAFF_SEED_PASSWORD, role: 'staff' },
          transaction,
        });
        if (!created) {
          await user.update(
            { name: demoStaff.name, password: process.env.STAFF_SEED_PASSWORD, role: 'staff' },
            { transaction },
          );
        }
      }
    });
  },
};
