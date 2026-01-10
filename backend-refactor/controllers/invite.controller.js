/**
 * Invite Controller
 * Handles invitation HTTP requests
 */

const inviteService = require('../services/invite.service');

/**
 * POST /api/v2/invites
 * Create and send class invitation
 */
async function createInvite(req, res) {
  try {
    const { classId, email, role } = req.body;
    const teacherId = req.user.id;
    
    if (!classId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Class ID and email are required'
      });
    }
    
    const invite = await inviteService.createInvite(teacherId, classId, email, role);
    
    res.status(201).json({
      success: true,
      data: {
        id: invite._id,
        email: invite.email,
        classId: invite.classId._id,
        className: invite.classId.title,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        accepted: invite.accepted
      },
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/invites/accept/:token
 * Accept class invitation
 */
async function acceptInvite(req, res) {
  try {
    const { token } = req.params;
    const userId = req.user.id;
    
    const result = await inviteService.acceptInvite(token, userId);
    
    res.status(200).json({
      success: true,
      data: {
        classId: result.class._id,
        className: result.class.title,
        enrollment: {
          id: result.enrollment._id,
          studentId: result.enrollment.studentId,
          enrolledAt: result.enrollment.createdAt
        }
      },
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/invites/class/:classId
 * Get pending invites for a class
 */
async function getPendingInvites(req, res) {
  try {
    const { classId } = req.params;
    
    const invites = await inviteService.getPendingInvites(classId);
    
    res.status(200).json({
      success: true,
      data: invites.map(invite => ({
        id: invite._id,
        email: invite.email,
        role: invite.role,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        createdBy: {
          id: invite.createdBy._id,
          name: invite.createdBy.name
        }
      })),
      count: invites.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invites'
    });
  }
}

/**
 * DELETE /api/v2/invites/:inviteId
 * Cancel an invitation
 */
async function cancelInvite(req, res) {
  try {
    const { inviteId } = req.params;
    const teacherId = req.user.id;
    
    await inviteService.cancelInvite(inviteId, teacherId);
    
    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  createInvite,
  acceptInvite,
  getPendingInvites,
  cancelInvite
};
