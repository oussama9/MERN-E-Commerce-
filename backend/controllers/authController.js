const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const crypto = require('crypto')
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');

//Register a new user  =>  /api/v1/register
exports.registerUser = catchAsyncErrors( async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id:'ahahahahah',
            url: 'https://st.depositphotos.com/2101611/3925/v/600/depositphotos_39258143-stock-illustration-businessman-avatar-profile-picture.jpg'
        }
    })

    sendToken(user, 201, res)
})

// Login user  =>  api/v1/login
exports.loginUser = catchAsyncErrors( async (req, res, next) => {
    const { email, password } = req.body

    // check if email and password are entered
    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //Finding user in database
    const user = await User.findOne({ email }).select('+password')

    if(!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    //checks if password correct
    const isPasswordMatched = await user.comparePassword(password)
   
    if(!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    sendToken(user, 200, res)
})

// Forgot password  =>  /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email});
    
    if(!user) {
        return next(new ErrorHandler('User not found with this email', 404))
    }
    const resetToken = user.getResetPasswordToken(); // Get reset token
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`  
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, ignore it`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'GMC commerce reset password',
            message
        });

        res.status(200).json({
            success: true,
            message: `Recovery email sent to ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save({ validateBeforeSave: false });
        
        return next(new ErrorHandler(error.message, 500))
    }

})

// Reset password  =>  /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors( async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex'); 
    
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user) {
        return next(new ErrorHandler('Password reset token is invalid or expired', 400))
    }

    if(req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Passwords does not match', 400))
    }

    // Set up new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save()
    sendToken(user, 200, res)
})

// Get currently logged in user details  =>  /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
    
})

// Update user profile  =>  /api/v1/me/update
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    //update avatar TODO

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true
    })

})

// Update or change password  =>  /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')

    // Check previous user password
    const isMatched =  await user.comparePassword(req.body.oldPassword);
    if(!isMatched) {
        return next( new ErrorHandler('Old password is incorrect', 400));
    }

    user.password = req.body.password
    await user.save();

    sendToken(user, 200, res);
})

// Logout user  =>  /api/v1/logout
exports.logout = catchAsyncErrors( async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "Logged out"
    })
})

/******************************* Admin part *************************************/

// Get all users   =>   /api/v1/admin/users
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})

// Get all users   =>   /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id : ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        user
    })
})

// Update user profile  =>  /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }
    //update avatar TODO

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true
    })

})

// Delete user   =>  /api/v1/admin/user/:id
exports.deletUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id : ${req.params.id}`, 404))
    }
    // Remove avatar from cloudinary - TODO

    await user.remove();

    res.status(200).json({
        success: true,
        message: "User deleted"
    })

})