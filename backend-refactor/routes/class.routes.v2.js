/**
 * Class Routes (V2)
 * Defines API endpoints for class management
 */

const express = require('express');
const router = express.Router();
const { createClassV2, getClassByCode } = require('../controllers/class.controller');

/**
 * @route POST /api/v2/classes
 * @desc Create a new class
 * @access Teacher
 */
router.post('/', createClassV2);

/**
 * @route GET /api/v2/classes/:code
 * @desc Get class by code
 * @access Public
 */
router.get('/:code', getClassByCode);

module.exports = router;
