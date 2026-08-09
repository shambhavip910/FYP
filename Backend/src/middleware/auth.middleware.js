const jwt = require('jsonwebtoken')

function authenticate(req, res, next) {
    const header = req.headers.authorization
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
    const token = req.cookies?.token || bearer

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = { id: payload.id, role: payload.role }
        return next()
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user?.role) {
            return res.status(401).json({ message: 'Authentication required' })
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission for this action',
                role: req.user.role,
            })
        }
        return next()
    }
}

module.exports = { authenticate, authorize }
