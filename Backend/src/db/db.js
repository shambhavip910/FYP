const mongoose=require('mongoose')

async function connectdb() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.error("Database Connection error :",error);
        process.exit(1);
    }
}

module.exports=connectdb;