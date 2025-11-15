# Email Setup for Password Reset

This guide explains how to configure email functionality for password reset OTPs.

## Email Service Configuration

The application uses Nodemailer to send password reset OTPs via email. You need to configure SMTP settings in your `.env` file.

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Option 2: Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

For SSL/TLS (port 465):
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

## Testing

1. Start the server: `npm run dev`
2. Navigate to `/forgot-password` on the frontend
3. Enter an email address
4. Check the email inbox for the OTP

## Troubleshooting

- **Email not sending**: Check that SMTP credentials are correct in `.env`
- **Connection timeout**: Verify SMTP host and port are correct
- **Authentication failed**: For Gmail, ensure you're using an App Password, not your regular password
- **Email in spam**: Check spam folder, or configure SPF/DKIM records for your domain

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords for Gmail instead of your main password
- In production, consider using a dedicated email service (SendGrid, AWS SES, etc.)

