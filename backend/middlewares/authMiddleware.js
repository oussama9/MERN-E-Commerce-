const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncErrors')

// Check if user is authenticated
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {
    const { token } = req.cookies;
    
    if(!token){
        return next(new ErrorHandler('You must be logged in', 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
    next()
})

// Handle users roles 
exports.authorizeRoles = (...roles) => {
    return(req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`,
             403))
        } 
        next()
    }
} 