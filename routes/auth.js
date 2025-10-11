// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .customSanitizer((v) => (v === '' ? undefined : v))
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .customSanitizer((v) => (v === '' ? undefined : v))
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional({ nullable: true })
    .customSanitizer(v => v === '' ? undefined : v)
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please enter a valid phone number'),
  body('age')
    .optional({ nullable: true })
    .customSanitizer(v => v === '' ? undefined : v)
    .toInt()
    .isInt({ min: 13, max: 100 })
    .withMessage('Age must be between 13 and 100'),
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender is required'),
  body('isPregnant')
    .optional({ nullable: true })
    .customSanitizer((v) => {
      if (typeof v === 'string') {
        if (v === 'on' || v === 'true' || v === '1') return true;
        if (v === 'off' || v === 'false' || v === '0' || v === '') return false;
      }
      return v;
    })
    .toBoolean()
    .isBoolean()
    .withMessage('isPregnant must be a boolean'),
  body('pregnancyStartDate')
    .optional({ nullable: true })
    .customSanitizer(v => v === '' ? undefined : v)
    .toDate()
    .isISO8601()
    .withMessage('Please enter a valid date'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Check if MongoDB is available
    if (!User || !User.findByEmail) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please try again later.'
      });
    }

    const { 
      name,
      email,
      password,
      phone,
      age,
      gender,
      isPregnant,
      pregnancyStartDate
    } = req.body;

    // Check if user already exists
    // const existingUser = await User.findByEmail(email);
    // if (existingUser) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'User with this email already exists'
    //   });
    // }

    const existingUser = await User.findByEmail(email)
      if (existingUser)
        return res.status(400).json({
      success: false,
      message: "User with this email already exist"
     })
    

    // Validate and calculate pregnancy data
    const pregnancyValidation = validatePregnancyData({
      isPregnant,
      pregnancyStartDate
    });

    if (!pregnancyValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: pregnancyValidation.error
      });
    }

    const { dueDate, currentWeek } = pregnancyValidation.data;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      age,
      gender,
      isPregnant,
      pregnancyStartDate,
      dueDate,
      currentWeek
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});
