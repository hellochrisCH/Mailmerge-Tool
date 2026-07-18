import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so the React app running on localhost:5173 can call this server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
}));

app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Endpoint to send a single email via user's SMTP credentials
app.post('/api/send-email', async (req, res) => {
  const { 
    senderName, 
    senderEmail, 
    smtpUser, 
    smtpPass, 
    smtpHost,
    smtpPort,
    smtpSecure,
    recipientEmail,
    subject,
    body,
    isHtml
  } = req.body;

  // Validate incoming fields
  if (!smtpUser || !smtpPass) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing SMTP Username or Password credentials.' 
    });
  }

  if (!recipientEmail || !subject || !body) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing recipient, subject, or email body.' 
    });
  }

  try {
    const isSecureConnection = smtpSecure === true || smtpSecure === 'true';
    
    // Configure customized SMTP transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: parseInt(smtpPort) || 465,
      secure: isSecureConnection, // true for port 465 SSL, false for port 587 STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        // Microsoft 365 / custom SMTP servers sometimes require tls configuration
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    // Verify connections before sending
    await transporter.verify();

    // Define message parameters
    const mailOptions = {
      from: senderName ? `"${senderName}" <${senderEmail || smtpUser}>` : (senderEmail || smtpUser),
      to: recipientEmail,
      subject: subject,
      [isHtml ? 'html' : 'text']: body
    };

    // Dispatch message
    const info = await transporter.sendMail(mailOptions);
    
    return res.json({ 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    });
  } catch (error) {
    console.error('SMTP Mail dispatch error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'SMTP communication failed.' 
    });
  }
});

// Start the express server
app.listen(PORT, () => {
  console.log(`MergeFlow Backend Server running on http://localhost:${PORT}`);
});
