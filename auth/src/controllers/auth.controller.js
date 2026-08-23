const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const { publishToQueue } = require("../broker/borker")

async function registerUser(req,res){
    try{
    const {username, email, password, fullName:{firstName, lastName}, role} = req.body;
    //ky gurantee h ki data sahi yh nhi yh glt toh nhi

    const isUserAlreadyExists = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]//agr koi user mil gya toh yh true return krega
    });

    if(isUserAlreadyExists){
        return res.status(409).json({
            message: "Username or email already exists"
        });
    }

    const hash = await bcrypt.hash(password, 10); 

    //if user not exist we create new user
    const user = await userModel.create({
        username,
        email,
        password : hash ,
        fullName:{firstName , lastName},
        role :role || 'user'//default role user hoga agr role nhi diya toh
    })

    console.log("Publishing USER_CREATED:", user.username);
    //queue mein data jaega  
    await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
            }),
            publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", user)
        ]);

    const token = jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
    }, process.env.JWT_SECRET , {expiresIn: '1d'});

    res.cookie('token',token ,{
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 //1 day
    })

    res.status(201).json({
        message: "User registered successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            fullName:user.fullName,
            role:user.role,
            addresses:user.addresses
        }
    });
} catch(err){
    console.error(err);
    res.status(500).json({
        message: "Internal server error"
    }); 
}
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        // find user with password selected
        const user = await userModel.findOne({ $or: [ { email }, { username } ] }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                addresses: user.addresses
            }
        });
    } catch (err) {
        console.error('Error in loginUser:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCurrentUser(req, res) {
    return res.status(200).json({
        message: "Current user fetched successfully",
        user: req.user
    });
}

async function logoutUser(req, res) {

    const token = req.cookies.token;

    if (token) {
        try {
            await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60); // expire in 1 day
        } catch (err) {
            console.error('Error blacklisting token:', err);
        }
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json({ message: "Logged out successfully" });

}

async function getUserAddresses(req, res) {

    const id = req.user.id

    const user = await userModel.findById(id).select('addresses');

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
        message: "User addresses fetched successfully",
        addresses: user.addresses
    });
}

async function addUserAddress(req, res) {

    const id = req.user.id

    const { street, city, state, pincode, country, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate({ _id: id }, {
        $push: {
            addresses: {
                street,
                city,
                state,
                pincode,
                country,
                isDefault
            }
        }
    }, { returnDocument: 'after' });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(201).json({
        message: "Address added successfully",
        address: user.addresses[ user.addresses.length - 1 ]
    });
}

async function deleteUserAddress(req, res) {

    const id = req.user.id;
    const { addressId } = req.params;


    const isAddressExists = await userModel.findOne({ _id: id, 'addresses._id': addressId });


    if (!isAddressExists) {
        return res.status(404).json({ message: "Address not found" });
    }

    const user = await userModel.findOneAndUpdate({ _id: id }, {
        $pull: {
            addresses: { _id: addressId }
        }
    }, { returnDocument: 'after' });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const addressExists = user.addresses.some(addr => addr._id.toString() === addressId);
    if (addressExists) {
        return res.status(500).json({ message: "Failed to delete address" });
    }

    return res.status(200).json({
        message: "Address deleted successfully",
        addresses: user.addresses
    });

}


async function updateProfile(req, res) {
    try {
        const id = req.user.id;
        const { username, email, fullName, currentPassword, newPassword } = req.body;

        const user = await userModel.findById(id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username || email) {
            const clash = await userModel.findOne({
                _id: { $ne: id },
                $or: [
                    ...(username ? [ { username } ] : []),
                    ...(email ? [ { email } ] : []),
                ]
            });
            if (clash) {
                return res.status(409).json({ message: 'Username or email already in use' });
            }
        }

        if (newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password || '');
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (fullName?.firstName) user.fullName.firstName = fullName.firstName;
        if (fullName?.lastName) user.fullName.lastName = fullName.lastName;

        await user.save();

        // username/email/role are embedded in the JWT, so reissue it to stay in sync.
        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                addresses: user.addresses
            }
        });
    } catch (err) {
        console.error('Error in updateProfile:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    getUserAddresses,
    addUserAddress,
    deleteUserAddress,
    updateProfile
}
