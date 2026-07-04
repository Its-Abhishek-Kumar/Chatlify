import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendRecoveryEmail } from "../utils/mailer.js";
// Helper to sanitize NoSQL inputs explicitly
const cleanString = (val) => {
    if (typeof val === "string")
        return val.trim();
    if (val && typeof val.toString === "function")
        return val.toString().trim();
    return "";
};
// SIGNUP
export const signup = async (req, res) => {
    try {
        const name = cleanString(req.body.name);
        const username = cleanString(req.body.username).toLowerCase();
        const password = cleanString(req.body.password);
        const rawIdentifier = cleanString(req.body.identifier);
        // 1. Validation Edge Cases
        if (!name || !username || !password || !rawIdentifier) {
            return res.status(400).json({ message: "All registration fields are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: "Username must be 3-20 characters long and alphanumeric" });
        }
        const isEmail = rawIdentifier.includes("@");
        let email = undefined;
        let mobileNumber = undefined;
        if (isEmail) {
            email = rawIdentifier.toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Please provide a valid email format" });
            }
        }
        else {
            // Normalize mobile number: strip all spaces, hyphens, parentheses, keeping only digits & +
            mobileNumber = rawIdentifier.replace(/[^\d+]/g, "");
            const phoneRegex = /^\+?[1-9]\d{5,14}$/;
            if (!phoneRegex.test(mobileNumber)) {
                return res.status(400).json({ message: "Please provide a valid international mobile number" });
            }
        }
        // 2. Duplicate Account Checking
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ message: "Email is already registered. Please sign in instead." });
            }
        }
        else if (mobileNumber) {
            const existingPhone = await User.findOne({ mobileNumber });
            if (existingPhone) {
                return res.status(400).json({ message: "Mobile number is already registered. Please sign in instead." });
            }
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username is already taken, please choose another" });
        }
        // 3. User Creation
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            username,
            password: hashed,
            email,
            mobileNumber,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`
        });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        // 4. Session Allocation (Overwriting duplicate device identifiers)
        const deviceName = cleanString(req.headers["user-agent"] || "Web Browser");
        const ipAddress = cleanString(req.ip || "127.0.0.1");
        const deviceId = cleanString(req.body.deviceId) || Math.random().toString(36).substring(2, 10);
        await Session.findOneAndUpdate({ userId: user._id, deviceId }, { deviceName, ipAddress, token, lastActive: new Date() }, { upsert: true, returnDocument: "after" });
        res.json({ token, user });
    }
    catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "An unexpected registration error occurred", error: err.message });
    }
};
// LOGIN
export const login = async (req, res) => {
    try {
        const rawIdentifier = cleanString(req.body.identifier);
        const password = cleanString(req.body.password);
        if (!rawIdentifier || !password) {
            return res.status(400).json({ message: "Identity credentials and password are required" });
        }
        const isEmail = rawIdentifier.includes("@");
        let query = {};
        if (isEmail) {
            query = { email: rawIdentifier.toLowerCase() };
        }
        else {
            query = {
                $expr: {
                    $eq: [
                        { $toLower: "$username" },
                        rawIdentifier.toLowerCase()
                    ]
                }
            };
        }
        // Query user safely by email or username
        const user = await User.findOne(query);
        if (!user) {
            return res.status(400).json({ message: "Account does not exist. Please sign up first." });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        // Record login session (Upserting to prevent session bloat)
        const deviceName = cleanString(req.headers["user-agent"] || "Web Browser");
        const ipAddress = cleanString(req.ip || "127.0.0.1");
        const deviceId = cleanString(req.body.deviceId) || Math.random().toString(36).substring(2, 10);
        await Session.findOneAndUpdate({ userId: user._id, deviceId }, { deviceName, ipAddress, token, lastActive: new Date() }, { upsert: true, returnDocument: "after" });
        res.json({ token, user });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "An unexpected login error occurred", error: err.message });
    }
};
// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const email = cleanString(req.body.email)?.toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Email address is required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "No account registered with this email address" });
        }
        // Generate a reset token (short-lived JWT)
        const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        console.log(`[PASSWORD RESET] Link generated for ${user.email}: ${resetLink}`);
        // Send recovery email using SMTP mailer
        await sendRecoveryEmail(user.email, resetLink);
        return res.status(200).json({
            message: "A password recovery link has been sent to your email address."
        });
    }
    catch (err) {
        console.error("Forgot password error:", err);
        res.status(err.message?.includes("SMTP mailer is not configured") ? 400 : 500).json({
            message: err.message || "Failed to process forgot password request"
        });
    }
};
// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const token = cleanString(req.body.token);
        const newPassword = cleanString(req.body.newPassword);
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            return res.status(400).json({ message: "Recovery link is invalid or has expired. Please request a new one." });
        }
        const email = decoded.email?.toLowerCase();
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Account does not exist" });
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        return res.status(200).json({ message: "Password has been successfully updated" });
    }
    catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Failed to reset password" });
    }
};
// LOGOUT
export const logout = async (req, res) => {
    try {
        const userId = req.userId;
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            await Session.findOneAndDelete({ userId, token });
        }
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Logout failed" });
    }
};
//# sourceMappingURL=authController.js.map