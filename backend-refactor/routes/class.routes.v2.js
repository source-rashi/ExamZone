/**
 * Class Routes (V2)
 * Defines API endpoints for class management
 */

const express = require('express');
const router = express.Router();
const { createClassV2, getClassByCode } = require('../controllers/class.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');

/**
 * @route POST /api/v2/classes
 * @desc Create a new class
 * @access Teacher only
 */
router.post('/', authenticate, teacherOnly, createClassV2);

/**
 * @route GET /api/v2/classes/:code
 * @desc Get class by code
 * @access Authenticated users
 */
router.get('/:code', authenticate, getClassByCode);

module.exports = router;
