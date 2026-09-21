const fields = ['street', 'number', 'city', 'state', 'postalCode', 'country'];

function isValidAddress(address) {
  return address !== null && typeof address === 'object' && !Array.isArray(address)
    && fields.every(field => typeof address[field] === 'string' && address[field].trim() !== '');
}

function publicAddress(address) {
  return Object.fromEntries(fields.map(field => [field, address[field]]));
}

module.exports = { isValidAddress, publicAddress };
