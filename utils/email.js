const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    ((this.to = user.email), (this.firstName = user.name.split(' ')[0]));
    this.url = url;
    this.from = `Ahmad Mahmoud ${process.env.EMAIL_FROM}`;
  }
  newTransport() {
    if (process.env.NODE_ENV == 'production') {
      //Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    //send the actual email
    //1) render html for email based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { firstName: this.firstName, url: this.url, subject }
    );
    //2) define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };
    //3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send(`Welcome`, `Welcome to Tourista Family!`);
  }
  async sendPasswordReset() {
    await this.send(
      `passwordReset`,
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
