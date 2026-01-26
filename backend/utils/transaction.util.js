/**
 * PHASE 8.7 - Transaction Utility
 * Provides database transaction support for critical operations
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Execute a function within a database transaction
 * Automatically handles commit/rollback
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} - Result from callback function
 * 
 * @example
 * const result = await withTransaction(async (session) => {
 *   await Model1.create([data], { session });
 *   await Model2.findOneAndUpdate(query, update, { session });
 *   return result;
 * });
 */
async function withTransaction(callback, options = {}) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction(options);
    
    const result = await callback(session);
    
    await session.commitTransaction();
    
    return result;
  } catch (error) {
    await session.abortTransaction();
    
    logger.logError(error, {
      context: 'transaction_failed',
      operation: callback.name || 'anonymous'
    });
    
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Retry a transaction if it fails due to transient errors
 * 
 * @param {Function} callback - Async function to execute
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<any>} - Result from successful execution
 */
async function withRetry(callback, maxRetries = 3, delayMs = 100) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;
      
      // Check if error is transient (network, timeout, version conflict)
      const isTransient = 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.name === 'MongoNetworkError' ||
        error.name === 'VersionError' ||
        (error.message && error.message.includes('version'));
      
      if (!isTransient || attempt === maxRetries) {
        break;
      }
      
      logger.logOperation('TRANSACTION_RETRY', {
        attempt,
        maxRetries,
        error: error.message
      });
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Combine transaction with retry logic
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @param {Object} options - Options for transaction and retry
 * @returns {Promise<any>} - Result from successful execution
 * 
 * @example
 * const result = await withTransactionRetry(async (session) => {
 *   // Critical operations
 * }, { maxRetries: 3 });
 */
async function withTransactionRetry(callback, options = {}) {
  const { maxRetries = 3, delayMs = 100, ...transactionOptions } = options;
  
  return withRetry(
    () => withTransaction(callback, transactionOptions),
    maxRetries,
    delayMs
  );
}

/**
 * Check if transactions are supported (requires replica set)
 * 
 * @returns {Promise<boolean>} - True if transactions are supported
 */
async function supportsTransactions() {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    
    // Transactions require replica set
    return serverStatus.repl && serverStatus.repl.setName;
  } catch (error) {
    logger.logError(error, { context: 'check_transaction_support' });
    return false;
  }
}

module.exports = {
  withTransaction,
  withRetry,
  withTransactionRetry,
  supportsTransactions
};
