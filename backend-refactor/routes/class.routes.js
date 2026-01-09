const express = require('express');
const router = express.Router();
const { createClass, joinClass } = require('../controllers/class.controller');

// POST /create-class - Create a new class with derived title and icon
router.post('/create-class', createClass);

// POST /join-class - Student joins a class
router.post('/join-class', joinClass);

module.exports = router;
