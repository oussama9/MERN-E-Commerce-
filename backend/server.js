const app = require('./app');
const connectDatabase = require('./config/database');

const dotenv = require('dotenv');

//Setting up config file
dotenv.config({path:'config/config.env'})


//Connecting to database
connectDatabase();

const server = app.listen(process.env.PORT, () => {
    console.log(`Server Started on port :${process.env.PORT} in ${process.env.NODE_ENV} mode` )
})

//Handle unhandled Promise rejection
process.on('unhandledRejection',err => {
    console.log(`ERROR: ${err.stack}`);
    console.log(`Shutting down the server due to Unhandled Promise rejection`);
    server.close(() => {
        process.exit(1)
    })
})