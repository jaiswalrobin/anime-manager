import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as aws from '@aws-sdk/client-ses';
import { LOGO_BASE64, ZORO_BASE64 } from 'src/assets/imageEncodings';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('SES_AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'SES_AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('SES_AWS_REGION');

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new Error(
        'AWS SES credentials are not set in the environment variables',
      );
    }

    // Create AWS SES client instance
    const ses = new aws.SES({
      region: region,
      apiVersion: '2010-12-01',
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    this.transporter = nodemailer.createTransport({
      SES: { ses, aws },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get<string>('APP_URL')}/auth/verify-email?token=${token}`;
    // const logoBase64 = this.configService.get<string>('LOGO_BASE64');
    // const saiBase64 = this.configService.get<string>('ZORO_BASE64');
    const logoBase64 = LOGO_BASE64;
    const saiBase64 = ZORO_BASE64;

    const emailBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          position: relative;
          background: linear-gradient(to bottom, #87CEEB, #07387b);
        }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo img { width: 260px; margin-left: 80px;}
        .logo .sai { width: 80px; margin-left: 0;}
        h2 { text-align: center; color: #eee; }
        .message { margin-bottom: 30px; }
        .verification-btn {
          display: block;
          width: 100%;
          max-width: 200px;
          margin: 0 auto;
          padding: 10px;
          background-color: #fff;
          color: #1d7c5f;
          text-decoration: none;
          text-align: center;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #fff;
        }
      </style>
    </head>
    <body>
      <div class="container" style="position:relative;">
        <div class="logo">
          <img src="cid:logo" alt="Logo">
          <img src="cid:sai" alt="Saitama" class="sai">
        </div>
        <h2>Email Verification</h2>
        <div class="message">
          <p>Dear User,</p>
          <p>Thank you for registering with our service. Please click the button below to verify your email address.</p>
        </div>

        <a href="${verificationUrl}" class="verification-btn">Verify Email</a>
        <div class="footer">
          <p>If you did not register with us, please ignore this email.</p>
          <p>&copy; 2024 AnimePix. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    const mailOptions = {
      from: this.configService.get<string>('SES_SENDER_EMAIL'),
      to: email,
      subject: 'Email Verification',
      html: emailBody,
      attachments: [
        {
          filename: 'logo.png',
          // content: Buffer.from(logoBase64, 'base64'),
          cid: 'logo',
          path: logoBase64,
        },
        {
          filename: 'sai.png',
          // content: Buffer.from(saiBase64, 'base64'),
          cid: 'sai',
          path: saiBase64,
        },
      ],
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Email could not be sent');
    }
  }

  async sendForgotPasswordEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    // Construct the reset link with the reset token
    const resetLink = `${this.configService.get<string>('APP_URL')}/auth/reset-password?token=${resetToken}`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('SES_SENDER_EMAIL'), // Replace with your "from" email address
      to: email,
      subject: 'Forgot Password Request',
      text: `You requested a password reset.`,
      html: `<p>You requested a password reset. Please click the link below to reset your password:</p>
             <a href="${resetLink}">Reset Password</a>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Forgot password email sent successfully');
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      throw new Error('Failed to send forgot password email');
    }
  }
}
