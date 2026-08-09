const express=require('express');
const authController=require('../controllers/auth.controller')

const router=express.Router();

router.post('/register',authController.registeruser);
router.post('/login',authController.loginuser);
router.post('/logout', (req, res) => {
    res.clearCookie('token', { sameSite: 'lax' });
    return res.status(200).json({ message: 'Logged out' });
});

module.exports=router;