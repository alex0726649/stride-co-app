const PAYMENT_METHODS = ['efectivo', 'transferencia'];
const ORDER_STATUSES = ['Pendiente de pago', 'Pagado', 'Cancelado'];

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

module.exports = { PAYMENT_METHODS, ORDER_STATUSES, isPositiveInteger };
