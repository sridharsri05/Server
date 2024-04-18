const bcrypt = require('bcrypt');
const User = require('../models/User');

// Function to update user profile
const updateUserProfile = async (userId, userData) => {
    try {
        // Construct update object based on provided fields
        const updateFields = {};
        if (userData.username) updateFields.username = userData.username;
        if (userData.email) updateFields.email = userData.email;
        if (userData.password) {
            // Hash the password before updating
            const hashedPassword = await bcrypt.hash(userData.password, 10); // Use bcrypt to hash the password
            updateFields.password = hashedPassword;
        }
        if (userData.profilePicture) updateFields.profilePicture = userData.profilePicture;

        // Update user profile in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields }, // Use $set operator to update specific fields
            { new: true } // Return the updated document
        );

        return updatedUser;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new Error('Internal server error');
    }
};

module.exports = updateUserProfile;
