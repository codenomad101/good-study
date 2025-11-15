import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email service for sending password reset OTPs
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize transporter from environment variables
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    // Only create transporter if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
    } else {
      console.warn('Email service not configured. SMTP credentials missing.');
    }
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOTP(email: string, otp: string, userName: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Padhero" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset OTP - Padhero',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF7846 0%, #FF5722 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp-box { background: white; border: 2px dashed #FF7846; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #FF7846; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>
                <p>You have requested to reset your password for your Padhero account.</p>
                <p>Please use the following OTP (One-Time Password) to reset your password:</p>
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                <p><strong>This OTP will expire in 15 minutes.</strong></p>
                <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>The Padhero Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Password Reset Request - Padhero
          
          Hello ${userName},
          
          You have requested to reset your password for your Padhero account.
          
          Your OTP (One-Time Password) is: ${otp}
          
          This OTP will expire in 15 minutes.
          
          If you did not request this password reset, please ignore this email.
          
          Best regards,
          The Padhero Team
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset OTP email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset OTP email:', error);
      return false;
    }
  }

  /**
   * Send password reset link email (alternative method)
   */
  async sendPasswordResetLink(email: string, resetLink: string, userName: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Padhero" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset Link - Padhero',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF7846 0%, #FF5722 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 30px; background: #FF7846; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>
                <p>You have requested to reset your password for your Padhero account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>The Padhero Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Password Reset Request - Padhero
          
          Hello ${userName},
          
          You have requested to reset your password for your Padhero account.
          
          Click the following link to reset your password:
          ${resetLink}
          
          This link will expire in 1 hour.
          
          If you did not request this password reset, please ignore this email.
          
          Best regards,
          The Padhero Team
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset link email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending password reset link email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

