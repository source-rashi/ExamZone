/**
 * PHASE 7.1 — Attempt Safety Cron
 * 
 * Run this periodically to maintain attempt hygiene:
 * • Auto-close expired attempts
 * • Check for integrity issues
 * • Log statistics
 * 
 * Usage:
 * node backend/scripts/attemptSafetyCron.js
 * 
 * Or add to crontab (runs every 5 minutes):
 * (crontab example) - /5 * * * * node /path/to/backend/scripts/attemptSafetyCron.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  autoCloseExpiredAttempts,
  verifyAttemptIntegrity,
  getAttemptStatistics
} = require('../services/attemptSafety.service');

async function runSafetyCron() {
  try {
    console.log('\n[ATTEMPT SAFETY CRON] Starting...');
    console.log(`[ATTEMPT SAFETY CRON] Time: ${new Date().toLocaleString()}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[ATTEMPT SAFETY CRON] Connected to MongoDB');

    // ==================================================================
    // STEP 1: Auto-close expired attempts
    // ==================================================================
    console.log('\n[STEP 1] Auto-closing expired attempts...');
    const closeResult = await autoCloseExpiredAttempts();
    
    if (closeResult.closedCount > 0) {
      console.log(`✓ Closed ${closeResult.closedCount} expired attempts`);
    } else {
      console.log('✓ No expired attempts found');
    }

    // ==================================================================
    // STEP 2: Verify integrity
    // ==================================================================
    console.log('\n[STEP 2] Verifying attempt integrity...');
    const integrityResult = await verifyAttemptIntegrity();
    
    if (integrityResult.issues.length > 0) {
      console.log(`⚠ Found ${integrityResult.issues.length} integrity issues:`);
      integrityResult.issues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.message || JSON.stringify(issue)}`);
      });
    } else {
      console.log('✓ No integrity issues found');
    }

    // ==================================================================
    // STEP 3: Get statistics
    // ==================================================================
    console.log('\n[STEP 3] Gathering statistics...');
    const stats = await getAttemptStatistics();
    
    console.log(`Total attempts: ${stats.total}`);
    console.log(`  - Started: ${stats.byStatus.started}`);
    console.log(`  - Submitted: ${stats.byStatus.submitted}`);
    console.log(`  - Auto-submitted: ${stats.byStatus.autoSubmitted}`);
    
    if (stats.oldestActive) {
      console.log(`Oldest active attempt: ${stats.oldestActive.attemptId} (${stats.oldestActive.ageMinutes} minutes old)`);
    }

    // ==================================================================
    // SUMMARY
    // ==================================================================
    console.log('\n[ATTEMPT SAFETY CRON] Complete');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('[ATTEMPT SAFETY CRON] Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[ATTEMPT SAFETY CRON] Disconnected from MongoDB\n');
  }
}

// Run immediately if called directly
if (require.main === module) {
  runSafetyCron()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runSafetyCron };
