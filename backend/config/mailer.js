const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBudgetAlert = async (userEmail, userName, tripName, budget, totalExpense) => {
  try {
    await transporter.sendMail({
      from: `"WanderVault 🌍" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⚠️ Budget Alert - ${tripName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #2563eb;">🌍 WanderVault</h2>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #dc2626; margin: 0;">⚠️ Budget Exceeded!</h3>
          </div>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your trip <strong>"${tripName}"</strong> has exceeded its budget!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Set Budget</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">₹${budget}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Total Spent</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">₹${totalExpense}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #e5e7eb;">Over By</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">₹${totalExpense - budget}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Please review your expenses on WanderVault.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">— WanderVault Team 🌍</p>
        </div>
      `
    });
    console.log('📧 Budget alert email sent!');
  } catch (error) {
    console.error('Email error:', error.message);
  }
};

module.exports = { sendBudgetAlert };