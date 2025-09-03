// Email service for sending confirmation emails
// You can replace this with your preferred email service (SendGrid, Resend, etc.)

interface EmailConfig {
  to: string
  subject: string
  html: string
}

export async function sendConfirmationEmail(email: string): Promise<boolean> {
  try {
    // For now, we'll use a simple email template
    // In production, you'd integrate with SendGrid, Resend, or another service
    
    const emailConfig: EmailConfig = {
      to: email,
      subject: "Welcome to PROSPEC Waitlist! 🚀",
      html: generateWaitlistConfirmationEmail(email)
    }

    // TODO: Replace with actual email service
    console.log('Would send email to:', email)
    console.log('Email content:', emailConfig.html)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return false
  }
}

function generateWaitlistConfirmationEmail(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to PROSPEC Waitlist</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #2a2a2a; border-radius: 8px; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .logo .pro { color: #ffffff; }
        .logo .spec { color: #f97316; }
        .content { line-height: 1.6; }
        .features { background-color: #333333; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .feature { margin-bottom: 15px; }
        .feature-title { color: #f97316; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #888888; font-size: 14px; }
        .button { display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="pro">PRO</span><span class="spec">SPEC</span>
          </div>
          <h2>Welcome to the Waitlist! 🚀</h2>
        </div>
        
        <div class="content">
          <p>Hi there,</p>
          
          <p>Thank you for joining the PROSPEC waitlist! You're now part of an exclusive group that will get early access to revolutionary construction estimation tools.</p>
          
          <div class="features">
            <h3 style="color: #f97316; margin-top: 0;">What's Coming:</h3>
            <div class="feature">
              <div class="feature-title">🏗️ AI-Powered Cost Analysis</div>
              <div>Machine learning algorithms for accurate project estimates</div>
            </div>
            <div class="feature">
              <div class="feature-title">💰 Real-Time Pricing</div>
              <div>Live material costs from major suppliers nationwide</div>
            </div>
            <div class="feature">
              <div class="feature-title">📊 Project Analytics</div>
              <div>Comprehensive reporting and trend analysis</div>
            </div>
            <div class="feature">
              <div class="feature-title">🤝 Multi-User Collaboration</div>
              <div>Team workspaces for contractors and clients</div>
            </div>
          </div>
          
          <p><strong>Early Access Benefits:</strong></p>
          <ul>
            <li>50% off your first year subscription</li>
            <li>Priority customer support</li>
            <li>Direct input on feature development</li>
            <li>Exclusive training sessions</li>
          </ul>
          
          <p>We'll notify you as soon as PROSPEC is ready for early access. In the meantime, feel free to follow our progress or reach out with any questions.</p>
          
          <p>Best regards,<br>
          The PROSPEC Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${email}</p>
          <p>© 2025 PROSPEC - Professional Construction Estimation Platform</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// For production use with SendGrid:
export async function sendEmailWithSendGrid(config: EmailConfig): Promise<boolean> {
  try {
    // Uncomment and configure when ready for production:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    
    const msg = {
      to: config.to,
      from: process.env.FROM_EMAIL, // Use the email address or domain you verified with SendGrid
      subject: config.subject,
      html: config.html,
    }
    
    await sgMail.send(msg)
    return true
    */
    
    console.log('SendGrid integration not yet configured')
    return false
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

// For production use with Resend:
export async function sendEmailWithResend(config: EmailConfig): Promise<boolean> {
  try {
    // Uncomment and configure when ready for production:
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: config.to,
      subject: config.subject,
      html: config.html,
    })
    
    return true
    */
    
    console.log('Resend integration not yet configured')
    return false
  } catch (error) {
    console.error('Resend error:', error)
    return false
  }
}
