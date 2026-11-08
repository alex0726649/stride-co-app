const { expressjwt } = require('express-jwt');
const { User } = require('../models/relationals');

const verifyToken = expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE
});

async function loadUser(req, res, next) {
    try {
        const user = await User.findByPk(req.auth.sub);

        if (!user || !user.active) {
            return res.status(401).json({
                message: 'No autorizado'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

const authenticate = [verifyToken, loadUser];

module.exports = { authenticate };