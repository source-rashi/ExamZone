/**
 * Email Templates
 * HTML email templates for various notifications
 */

/**
 * Class invitation email template
 * @param {Object} params - { className, teacherName, role, acceptUrl, expiresAt }
 * @returns {String} HTML email
 */
function classInviteEmail({ className, teacherName, role, acceptUrl, expiresAt }) {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-box { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Class Invitation</h1>
        </div>
        <div class="content">
          <h2>You're Invited!</h2>
          <p>Hello,</p>
          <p><strong>${teacherName}</strong> has invited you to join their class:</p>
          
          <div class="info-box">
            <h3>${className}</h3>
            <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          </div>
          
          <p>Click the button below to accept this invitation and join the class:</p>
          
          <center>
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>Note:</strong> This invitation will expire on <strong>${expiryDate}</strong>.
          </p>
          
          <p style="font-size: 12px; color: #999;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${acceptUrl}">${acceptUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>© 2026 ExamZone. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exam published notification email
 * @param {Object} params - { studentName, examTitle, className, startTime, endTime, durationMinutes }
 * @returns {String} HTML email
 */
function examPublishedEmail({ studentName, examTitle, className, startTime, endTime, durationMinutes }) {
  const startDate = new Date(startTime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const endDate = new Date(endTime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info-box { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 New Exam Published</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>A new exam has been published in <strong>${className}</strong>.</p>
          
          <div class="info-box">
            <h3>${examTitle}</h3>
            
            <div class="detail-row">
              <span><strong>Duration:</strong></span>
              <span>${durationMinutes} minutes</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Available From:</strong></span>
              <span>${startDate}</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Available Until:</strong></span>
              <span>${endDate}</span>
            </div>
          </div>
          
          <p>Make sure you're prepared and attempt the exam during the available time window.</p>
          <p><strong>Good luck! 🍀</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 ExamZone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exam closed notification email
 * @param {Object} params - { studentName, examTitle, className }
 * @returns {String} HTML email
 */
function examClosedEmail({ studentName, examTitle, className }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info-box { background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Exam Closed</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>The exam submission period has ended for:</p>
          
          <div class="info-box">
            <h3>${examTitle}</h3>
            <p><strong>Class:</strong> ${className}</p>
          </div>
          
          <p>Your answers are being evaluated. Results will be published soon.</p>
          <p>Thank you for your participation! 📊</p>
        </div>
        <div class="footer">
          <p>© 2026 ExamZone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Results published notification email
 * @param {Object} params - { studentName, examTitle, className, score, totalMarks }
 * @returns {String} HTML email
 */
function resultPublishedEmail({ studentName, examTitle, className, score, totalMarks }) {
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const color = percentage >= 60 ? '#4CAF50' : percentage >= 40 ? '#FF9800' : '#F44336';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .score-box { background-color: white; padding: 30px; text-align: center; border: 3px solid ${color}; border-radius: 10px; margin: 20px 0; }
        .score { font-size: 48px; font-weight: bold; color: ${color}; }
        .info-box { background-color: #f5f5f5; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Results Published</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your results are now available for:</p>
          
          <div class="info-box">
            <h3>${examTitle}</h3>
            <p><strong>Class:</strong> ${className}</p>
          </div>
          
          <div class="score-box">
            <p style="margin: 0; font-size: 18px; color: #666;">Your Score</p>
            <div class="score">${score} / ${totalMarks}</div>
            <p style="margin: 10px 0 0 0; font-size: 24px; color: ${color};">${percentage}%</p>
          </div>
          
          <p style="text-align: center;">
            ${percentage >= 60 ? 'Congratulations! Great job! 🎊' : percentage >= 40 ? 'Good effort! Keep improving! 💪' : 'Keep practicing! You can do better next time! 📚'}
          </p>
        </div>
        <div class="footer">
          <p>© 2026 ExamZone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  classInviteEmail,
  examPublishedEmail,
  examClosedEmail,
  resultPublishedEmail
};
