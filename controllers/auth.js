const { User } = require('../models/relationals');
const { verifyPassword} = require('../utils/password');
const INVALID_CREDENTIALS = { message : "Invalid Credentials"}

async function login(req, res, next){
    const  { email, password } = req.body;
    const user = await User.findOne({ where: {email} });
    if (!user || !user.active) return res.status(401).json(INVALID_CREDENTIALS);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid ) return res.status(401).json(INVALID_CREDENTIALS);

    res.json({
        message : "Login succesful",
        data:{

        }
    });


}

module.exports = { login}