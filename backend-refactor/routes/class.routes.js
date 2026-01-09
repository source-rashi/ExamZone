const express = require('express');
const router = express.Router();
const { createClass, joinClass } = require('../controllers/class.controller');
const { validateCreateClass, validateJoinClass } = require('../middleware/validate.middleware');

// POST /create-class - Create a new class with derived title and icon
router.post('/create-class', validateCreateClass, createClass);

// POST /join-class - Student joins a class
router.post('/join-class', validateJoinClass, joinClass);

module.exports = router;
