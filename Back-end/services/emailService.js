// Use native fetch (available in Node 18+)

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER = {
    name: 'MAKTABA',
    email: 'supportmaktaba@gmail.com'
};

const getBrevoKey = () => process.env.BREVO_API_KEY;

// Base HTML wrapper to match Maktaba's theme
const generateHtmlTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Jost', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #fbfaf8;
            color: #0d0d0d;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #0d0d0d;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-family: 'Playfair Display', serif;
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            font-size: 16px;
        }
        .content h2 {
            font-family: 'Playfair Display', serif;
            color: #0d0d0d;
            margin-top: 0;
        }
        .footer {
            background-color: #fbfaf8;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #7b7873;
            border-top: 1px solid #e8e4db;
        }
        .btn {
            display: inline-block;
            background-color: #9f3d35;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 4px;
            font-weight: 500;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .otp-box {
            background-color: #f4f1eb;
            border: 1px dashed #d4c4b0;
            padding: 15px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #9f3d35;
            margin: 20px 0;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MAKTABA</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Maktaba. All rights reserved.</p>
            <p>If you have any questions, reply to this email or contact us.</p>
        </div>
    </div>
</body>
</html>
`;

async function sendEmail(toEmail, toName, subject, htmlContent) {
    const apiKey = getBrevoKey();
    if (!apiKey) {
        console.warn('BREVO_API_KEY is not set. Skipping email send.');
        return false;
    }

    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: SENDER,
                to: [{ email: toEmail, name: toName }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Brevo API Error:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

exports.sendWelcomeEmail = async (email, name) => {
    const title = 'Welcome to Maktaba';
    const content = `
        <h2>Welcome to Maktaba, ${name}!</h2>
        <p>We are thrilled to have you join our community of readers. Your account has been successfully created.</p>
        <p>At Maktaba, you'll find a carefully curated selection of books across all genres, waiting to be discovered.</p>
        <p>Pick up where you left off — your shelf, your favourites, and your orders are waiting.</p>
        <div style="text-align: center;">
            <a href="http://localhost:3000/home" class="btn">Start Browsing</a>
        </div>
    `;
    return sendEmail(email, name, title, generateHtmlTemplate(title, content));
};

exports.sendPasswordChangeEmail = async (email, name) => {
    const title = 'Your Password Was Changed';
    const content = `
        <h2>Hello ${name},</h2>
        <p>This is a confirmation that the password for your Maktaba account has just been changed.</p>
        <p>If you made this change, you can safely ignore this email.</p>
        <p>If you did not change your password, please contact our support team immediately to secure your account.</p>
    `;
    return sendEmail(email, name, title, generateHtmlTemplate(title, content));
};

exports.sendPasswordResetOtp = async (email, otp) => {
    const title = 'Your Password Reset Code';
    const content = `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your Maktaba account associated with this email address.</p>
        <p>Please enter the following 6-digit verification code to proceed:</p>
        <div class="otp-box">${otp}</div>
        <p>This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
    `;
    return sendEmail(email, 'Maktaba Reader', title, generateHtmlTemplate(title, content));
};

exports.sendEmailVerificationOtp = async (email, otp) => {
    const title = 'Verify Your Email Address';
    const content = `
        <h2>Email Verification</h2>
        <p>Please use the following 6-digit verification code to verify your email address:</p>
        <div class="otp-box">${otp}</div>
        <p>This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    `;
    return sendEmail(email, 'Maktaba Reader', title, generateHtmlTemplate(title, content));
};

exports.sendOrderConfirmationEmail = async (email, name, order) => {
    const title = 'Order Confirmation - Maktaba';
    
    let itemsHtml = '<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">';
    itemsHtml += '<tr style="border-bottom: 1px solid #e8e4db; text-align: left;"><th style="padding: 10px 0;">Item</th><th style="padding: 10px 0;">Qty</th><th style="padding: 10px 0; text-align: right;">Price</th></tr>';
    
    order.items.forEach(item => {
        itemsHtml += `
            <tr style="border-bottom: 1px solid #e8e4db;">
                <td style="padding: 15px 0;">
                    <strong>${item.title}</strong><br>
                    <span style="font-size: 13px; color: #7b7873;">${item.author}</span>
                </td>
                <td style="padding: 15px 0;">${item.quantity || 1}</td>
                <td style="padding: 15px 0; text-align: right;">L.E ${(item.price * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
        `;
    });
    
    itemsHtml += `
        <tr>
            <td colspan="2" style="padding: 15px 0; text-align: right;"><strong>Total</strong></td>
            <td style="padding: 15px 0; text-align: right;"><strong>L.E ${Number(order.totalAmount).toFixed(2)}</strong></td>
        </tr>
    </table>`;

    const content = `
        <h2>Thank you for your order, ${name}!</h2>
        <p>We've received your order <strong>#${order.orderNumber}</strong> and are getting it ready for you.</p>
        <p><strong>Order Summary:</strong></p>
        ${itemsHtml}
        <p style="margin-top: 30px;">We'll notify you once your order has been shipped. Thank you for choosing Maktaba!</p>
    `;
    
    return sendEmail(email, name, `Order Confirmation #${order.orderNumber}`, generateHtmlTemplate(title, content));
};
