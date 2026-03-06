// ---------------- Email Notification ----------------
import { fromURL } from 'cheerio';
import nodemailer from 'nodemailer';

  export async function sendEmail(failedPages) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      family: 4,  // Force IPv4 (disable IPv6)
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      const info = await transporter.sendMail({
        from: 'aemuser@stratton.com.au',
        to: 'swetha@iamhelium.com.au',
        subject: 'URL Variable Validation Report',
        html: `<h3>Failed Pages Report</h3><ul>${failedPages.map(page => `<li><strong>${page.url}</strong><br>Variables: ${page.variables.join(', ')}</li>`).join('')}</ul>`
      });
      console.log('Email sent successfully:', info.response);
      return info;
    } catch (error) {

      console.error('Error sending email:', error.message);
      throw error;
    }
}