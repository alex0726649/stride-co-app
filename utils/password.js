const bcrypt = require('bcrypt');
const config = require('config');

async function hashPassword(password) {
    const saltRounds = config.get('bcrypt.saltRounds');
    const saltKey = await bcrypt.genSalt(saltRounds);
    const securePassword = await bcrypt.hash(password, saltKey);
    return { securePassword, saltKey}

}
function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);

}

module.exports = { hashPassword, verifyPassword }