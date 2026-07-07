const express=require('express')
const cookieParser=require('cookie-parser')
const app=express();
const authRoutes=require('./routes/auth.routes')
const deliveryRoutes=require('./routes/delivery.routes')
const vehicleRoutes=require('./routes/vehicle.routes')
const resultRoutes=require('./routes/results.routes')
const adminRoutes=require('./routes/admin.routes')
const cors = require('cors');


app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use('/api/auth',authRoutes)
app.use('/api/delivery',deliveryRoutes)
app.use('/api/vehicle',vehicleRoutes)
app.use('/api/result',resultRoutes)
app.use('/api/admin',adminRoutes)

module.exports=app;