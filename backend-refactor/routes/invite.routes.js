/**
 * Invite Routes
 * Defines API endpoints for invitation management
 */

const express = require('express');
const router = express.Router();
const {
  createInvite,
  acceptInvite,
  getPendingInvites,
  cancelInvite
} = require('../controllers/invite.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { teacherOnly } = require('../middleware/role.middleware');

/**
 * @route POST /api/v2/invites
 * @desc Create and send class invitation
 * @access Teacher only
 */
router.post('/', authenticate, teacherOnly, createInvite);

/**
 * @route POST /api/v2/invites/accept/:token
 * @desc Accept class invitation
 * @access Authenticated users
 */
router.post('/accept/:token', authenticate, acceptInvite);

/**
 * @route GET /api/v2/invites/class/:classId
 * @desc Get pending invites for a class
 * @access Teacher only
 */
router.get('/class/:classId', authenticate, teacherOnly, getPendingInvites);

/**
 * @route DELETE /api/v2/invites/:inviteId
 * @desc Cancel an invitation
 * @access Teacher only
 */
router.delete('/:inviteId', authenticate, teacherOnly, cancelInvite);

module.exports = router;
