const { Customer, Order } = require('../models/documents');

// Los ObjectId fijos permiten reintentar la carga mediante el índice único de _id.
const DEMO_ORDERS = [
  { customerRole: 'user', customerId: '674000000000000000020401', orderId: '674000000000000000020411' },
  { customerRole: 'admin', customerId: '674000000000000000020402', orderId: '674000000000000000020412' },
];

async function seedMongo(users, demoProductId) {
  const now = new Date();
  const dates = { createdAt: now, updatedAt: now };
  const options = { upsert: true, runValidators: true, timestamps: false };
  const salesPersonId = users.get('sales').id;

  for (const { customerRole, customerId, orderId } of DEMO_ORDERS) {
    const user = users.get(customerRole);
    await Customer.updateOne({ _id: customerId }, {
      $set: { userId: user.id },
      $setOnInsert: { ...dates, email: user.email },
    }, options);

    const orderDefaults = {
      paymentMethod: 'efectivo',
      items: [{ productId: demoProductId, quantity: 1, unitPrice: 1299 }],
    };
    await Order.updateOne({ _id: orderId }, {
      $setOnInsert: {
        ...dates,
        customerId,
        salesPersonId,
        ...orderDefaults,
        status: 'Pendiente de pago',
        totals: { subtotal: 1299, shipping: 0, discount: 0, total: 1299 },
      },
    }, options);

    for (const [field, value] of Object.entries(orderDefaults)) {
      await Order.updateOne(
        { _id: orderId, [field]: { $exists: false } },
        { $set: { [field]: value } },
        { runValidators: true, timestamps: false },
      );
    }
  }
}

module.exports = seedMongo;
