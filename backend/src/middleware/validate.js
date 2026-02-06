const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({ error: errorMessages });
  }
  next();
};

// Auth schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()])[A-Za-z\d@$!%*?&#^()]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  name: Joi.string().allow('', null),
  fullName: Joi.string().allow('', null),
  role: Joi.string().valid('employee').default('employee').messages({
    'any.only': 'Registration is only allowed for employee role'
  }),
  department: Joi.string().allow('', null),
  mobileNumber: Joi.string().allow('', null),
  employeeId: Joi.string().allow('', null),
  confirmPassword: Joi.string().allow('', null),
  profilePhoto: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const leaveSchema = Joi.object({
  leaveType: Joi.string().valid('Sick', 'Casual', 'Earned').required().messages({
    'any.only': 'Leave type must be Sick, Casual, or Earned',
    'any.required': 'Leave type is required'
  }),
  startDate: Joi.date().iso().required().messages({
    'date.format': 'Start date must be a valid date',
    'any.required': 'Start date is required'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.min': 'End date must be after or equal to start date',
    'any.required': 'End date is required'
  }),
  reason: Joi.string().max(500).allow('', null).messages({
    'string.max': 'Reason must be less than 500 characters'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(100).allow('', null),
  mobileNumber: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).allow('', null).messages({
    'string.pattern.base': 'Please provide a valid mobile number'
  }),
  profilePhoto: Joi.string().allow('', null)
});

const leaveStatusSchema = Joi.object({
  status: Joi.string().valid('Approved', 'Rejected').required().messages({
    'any.only': 'Status must be Approved or Rejected',
    'any.required': 'Status is required'
  }),
  remarks: Joi.string().max(500).allow('', null)
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  leaveSchema,
  updateProfileSchema,
  leaveStatusSchema
};
