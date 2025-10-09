const sgMail = require('@sendgrid/mail');
const pug = require('pug');
const htmlToText = require('html-to-text');
const path = require('path');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ahmad Mahmoud <${process.env.EMAIL_FROM}>`;

    // Set SendGrid API Key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(template, subject) {
    // 1) Render HTML from your Pug template
    const html = pug.renderFile(
      path.join(__dirname, `../views/emails/${template}.pug`),
      { firstName: this.firstName, url: this.url, subject }
    );

    // 2) Define the email
    const msg = {
      to: this.to,
      from: this.from,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) Send via SendGrid API
    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${this.to}`);
    } catch (err) {
      console.error(`❌ Error sending email: ${err.message}`);
      if (err.response) {
        console.error(err.response.body);
      }
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Tourista Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
