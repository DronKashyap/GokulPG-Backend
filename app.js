const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const z = require('zod');
const bodyParser = require('body-parser');
const {User} = require('./Models/Users');
const {Property} = require('./Models/Properties');
const {Blog} = require('./Models/Blog');
const {Reviews} = require('./Models/Reviews');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors=require('cors');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
require('dotenv').config()

const app = express();
const port = process.env.PORT;
 // adding env variables:
 const mongourl=process.env.MONGO_URL
const jwtsecret=process.env.JWT_SECRET
const gmailapppass=process.env.APP_PASS

// Connect to MongoDB
mongoose.connect(`${mongourl}`)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//checkadmin middleware
const checkAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming token is in the format "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token,`${jwtsecret}` );
    
    if (decoded.userId !== '66198821b89ced7cebb14197') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};


// Set up session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'strict',
    secure: false, // Set to true in production if using HTTPS
  },
}));

// Schema validation with Zod
const newUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(50),
});

// Middleware to check if the user is logged in
const checkUserLoggedIn = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token,`${jwtsecret}`);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};


//ClientSideRoutes 
app.get('/', (req, res) => {
    res.json("Backend is running");
});




app.post('/signin', async (req, res) => {
    console.log(req.body);
    try {
      const { username, password } = req.body;
  
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).send({ error: 'Invalid username' });
      }
  
      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).send({ error: 'Invalid password' });
      }
  
      // Passwords match, user is authenticated
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, `${jwtsecret}`, { expiresIn: '1h' });
      console.log(token)
  
      // You can store user data in session or generate JWT token here if needed
      req.session.username = user.username;
      req.session.user = user; // Store user in session
  
      // Send JWT token along with the response
      res.status(200).json({ message: 'Logged in successfully', token });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send({ error: 'Login failed' });
    }
  });

app.post('/signup', async (req, res) => {
    console.log(req.body);
    try {
      const { username, email, password } = req.body;
      
      // Input validation
      const validatedData = newUserSchema.parse({ username, email, password });
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
  
      // Create new user with hashed password
      const newUser = new User({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword, // Save hashed password to the database
      });
  
      // Save the new user to the database
      const createdUser = await newUser.save();
  
      res.status(201).json({ message: 'User created successfully!', user: createdUser });
    } catch (error) {
      console.error('Error during signup:', error);
      res.status(400).json({ error: error.message }); // Send back validation error message
    }
  });

  
  
app.get('/blog', async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

app.get('/reviews', async (req, res) => {
  try {
    const reviews = await Reviews.find();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

app.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find();
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});
app.get('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});



//AdminsideRoutes

app.get('/admin', checkUserLoggedIn, checkAdmin, async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById('66198821b89ced7cebb14197');
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    // Send the username as the JSON response
    res.send({ username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

// app.get('/admin/blog', checkAdmin, async (req, res) => {
//   try {
//     const blogs = await Blog.find();
//     res.status(200).json(blogs);
//   } catch (error) {
//     res.status(500).json({ message: 'Internal Server Error', error });
//   }
// });
app.post('/admin/addblog', checkAdmin, async (req, res) => {
  const { heading, body , author} = req.body;
  // const author = req.session.user.username;

  try {
    const blog = new Blog({
      author,
      heading,
      body,
    });

    await blog.save();
    res.status(201).json({ message: 'Blog post created successfully', blog });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

app.post('/admin/addreviews', checkAdmin, async (req, res) => {
  const { content,  author } = req.body;
  // const author = req.session.user.username;

  try {
    const review = new Reviews({
      author,
      content,
    });

    await review.save();
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});



app.post('/admin/addproperty', checkAdmin, async (req, res) => {
  try {
    console.log(req.body);
    const {
      PgName,
      PgLocation,
      PrivateRoomPrice,
      DoubleSeaterRoomPrice,
      TripleSeaterRoomPrice,
      ImageUrls,
    } = req.body;
    const imageUrlArray = Array.isArray(ImageUrls) ? ImageUrls : [ImageUrls];

    const property = new Property({
      PgName,
      PgLocation,
      PrivateRoomPrice,
      DoubleSeaterRoomPrice,
      TripleSeaterRoomPrice,
      ImageUrls:imageUrlArray,
    });
    
    const newProperty = await property.save();
    console.log(req.body)
    res.status(201).json(newProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error adding property', error: error.message });
  }
});

app.put('/admin/addproperty/:id', checkAdmin, async (req, res) => {
  try {
    const {
      PgName,
      PgLocation,
      PrivateRoomPrice,
      DoubleSeaterRoomPrice,
      TripleSeaterRoomPrice,
      ImageUrls,
    } = req.body;

    const imageUrlArray = Array.isArray(ImageUrls) ? ImageUrls : [ImageUrls];

    const property = {
      PgName,
      PgLocation,
      PrivateRoomPrice,
      DoubleSeaterRoomPrice,
      TripleSeaterRoomPrice,
      ImageUrls: imageUrlArray,
    };

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, property, { new: true });

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property', error: error.message });
  }
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ravisheksingh69@gmail.com',  // Your Gmail email address
    pass: `${gmailapppass}`  // Your generated app password without spaces
  }
});

// Email sending route
app.post('/send-email', (req, res) => {
  const { firstname, lastname, email, phone } = req.body;

  const mailOptions = {
    from: 'ravisheksingh69@gmail.com',
    to: 'ravishekstar@gmail.com',
    subject: 'New Query for Gokul PG',
    text: `
      First Name: ${firstname}
      Last Name: ${lastname}
      Email: ${email}
      Phone No.: ${phone}
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ message: 'Email sending failed', error: error.message });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Email sent successfully', info: info.response });
    }
  });
});


app.listen(port, () => {
    console.log(`Gokul PG is now online on port ${port}!`);
  });
  
