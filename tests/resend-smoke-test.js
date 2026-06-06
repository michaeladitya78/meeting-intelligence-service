require('dotenv').config();
const { Resend } = require('resend');

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log('Testing Resend API key...');
  console.log('API Key prefix:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

  try {
    // Attempt to send a test email
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend's own domain always works
      to: 'delivered@resend.dev',    // Resend's test inbox
      subject: 'Meeting Intelligence Service - API Test',
      html: '<p>✅ Resend integration is working correctly!</p>',
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
    } else {
      console.log('✅ Resend API working! Email ID:', data?.id);
    }
  } catch (e) {
    console.error('FAILED:', e.message);
  }
}

main();
