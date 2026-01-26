/**
 * PHASE 8.7 - System Health Controller
 * Provides health check and database status endpoints
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
const { Exam, ExamAttempt, Enrollment, Class, User } = require('../models');

/**
 * Basic health check
 * GET /api/health
 */
async function healthCheck(req, res) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/health' });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}

/**
 * Database health check
 * GET /api/health/database
 */
async function databaseHealth(req, res) {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Test database with a simple query
    const startTime = Date.now();
    await User.findOne().lean();
    const queryTime = Date.now() - startTime;

    const health = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      database: {
        state: stateMap[dbState],
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        queryTime: `${queryTime}ms`
      },
      timestamp: new Date().toISOString()
    };

    res.status(dbState === 1 ? 200 : 503).json(health);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/health/database' });
    res.status(503).json({
      status: 'unhealthy',
      database: { state: 'error', error: error.message },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * System statistics
 * GET /api/health/stats
 * Requires authentication
 */
async function systemStats(req, res) {
  try {
    // Only allow admins or teachers to view stats
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    const [
      totalUsers,
      totalClasses,
      totalExams,
      totalAttempts,
      totalEnrollments
    ] = await Promise.all([
      User.countDocuments(),
      Class.countDocuments(),
      Exam.countDocuments(),
      ExamAttempt.countDocuments(),
      Enrollment.countDocuments()
    ]);

    const stats = {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      database: {
        collections: {
          users: totalUsers,
          classes: totalClasses,
          exams: totalExams,
          attempts: totalAttempts,
          enrollments: totalEnrollments
        }
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);
  } catch (error) {
    logger.logError(error, { endpoint: '/api/health/stats' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system stats'
    });
  }
}

/**
 * Data integrity quick check
 * GET /api/health/integrity
 * Requires authentication (teacher/admin only)
 */
async function integrityCheck(req, res) {
  try {
    // Only allow admins or teachers
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    // Quick integrity checks
    const issues = [];

    // Check for attempts without valid exams
    const orphanedAttempts = await ExamAttempt.countDocuments({
      exam: { $nin: await Exam.distinct('_id') }
    });

    if (orphanedAttempts > 0) {
      issues.push({
        type: 'orphaned_attempts',
        count: orphanedAttempts,
        severity: 'high'
      });
    }

    // Check for enrollments without valid classes
    const orphanedEnrollments = await Enrollment.countDocuments({
      classId: { $nin: await Class.distinct('_id') }
    });

    if (orphanedEnrollments > 0) {
      issues.push({
        type: 'orphaned_enrollments',
        count: orphanedEnrollments,
        severity: 'medium'
      });
    }

    // Check for inconsistent scores
    const inconsistentScores = await ExamAttempt.countDocuments({
      score: { $exists: true, $gt: 0 },
      maxMarks: { $exists: true },
      $expr: { $gt: ['$score', '$maxMarks'] }
    });

    if (inconsistentScores > 0) {
      issues.push({
        type: 'inconsistent_scores',
        count: inconsistentScores,
        severity: 'low'
      });
    }

    const status = issues.length === 0 ? 'healthy' : 'issues_found';

    res.status(200).json({
      status,
      issues,
      totalIssues: issues.reduce((sum, issue) => sum + issue.count, 0),
      recommendation: issues.length > 0 
        ? 'Run full integrity check script: node scripts/checkDataIntegrity.js'
        : 'No integrity issues detected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/health/integrity' });
    res.status(500).json({
      success: false,
      error: 'Failed to check data integrity'
    });
  }
}

module.exports = {
  healthCheck,
  databaseHealth,
  systemStats,
  integrityCheck
};
