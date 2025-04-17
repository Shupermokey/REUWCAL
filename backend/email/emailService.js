import nodemailer from "nodemailer";
import { config } from "dotenv";
import { auth } from "../firebase/adminConfig.js"; // ✅ Import Firebase Auth

config();

// 🔹 Replace with your own email and password (or use App Passwords for security)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail email
        pass: process.env.EMAIL_PASS, // Your Gmail password (or App Password)
    },
});

const actionCodeSettings = {
    url: "http://localhost:5173/home",
    handleCodeInApp: true,
};

/**
 * ✅ Generates a Magic Login Link & Sends Email
 */
export async function sendMagicLinkEmail(email) {
    try {
        // 🔹 Generate the Firebase Magic Link
        const actionCodeSettings = {
            url: "http://localhost:5173/home", // ✅ Your frontend login page
            handleCodeInApp: true, // Allows sign-in without password
        };

        const magicLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings);

        // 🔹 Prepare Email Content
        const mailOptions = {
            from: `"Your App" <${process.env.EMAIL_USER}>`, // Sender email
            to: email,
            subject: "Your Magic Login Link",
            text: `Click this link to log in: ${magicLink}`,
            html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
        };

        // 🔹 Send Email
        await transporter.sendMail(mailOptions);
        console.log(`📧 Magic login link sent to ${email}`);
    } catch (error) {
        console.error(`❌ Error sending email: ${error.message}`);
    }
}
