const mongoose = require('mongoose');

// Define User Schema

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default:
        'https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg',
    },
  },
  { timestamps: true }
);

// Create User model
const User = mongoose.model('User', userSchema);



// // Create a new user
// const newUser = new User({
//     username: 'exampleUser',
//     email: 'example@example.com',
//     password: 'password123',
//   });
  
//   // Save the new user to the database
//   newUser.save()
//     .then(savedUser => {
//       console.log('New user created:', savedUser);
//     })
//     .catch(error => {
//       console.error('Error creating user:', error);
//     });


module.exports = { User };

