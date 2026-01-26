const express = require('express');
const router = express.Router();
const { createClass, joinClass } = require('../controllers/class.controller');
const { 
  createClassValidation, 
  joinClassValidation, 
  handleValidationErrors 
} = require('../middleware/validation');

// POST /create-class - Create a new class with derived title and icon
router.post('/create-class', createClassValidation, handleValidationErrors, createClass);

// POST /join-class - Student joins a class
router.post('/join-class', joinClassValidation, handleValidationErrors, joinClass);

module.exports = router;
