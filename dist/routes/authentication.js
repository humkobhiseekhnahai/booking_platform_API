"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const { prisma } = require('../utils/client');
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const router = express_1.default.Router();
const bcrypt = require("bcrypt");
const jwtSecret = process.env.JWT_SECRET_KEY;
router.use(express_1.default.json());
if (!jwtSecret) {
    throw new Error("jwtSecret is not defined");
}
var userType;
(function (userType) {
    userType["speaker"] = "speaker";
    userType["user"] = "user";
})(userType || (userType = {}));
router.post("/signup", async (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const user_type = req.body.user_type;
    try {
        const find = await prisma.users.findUnique({
            where: {
                email
            }
        });
        if (!find) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const response = await prisma.users.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: hashedPassword,
                    user_type: user_type
                }
            });
            const credentials = {
                "email": email,
            };
            const token = jsonwebtoken_1.default.sign(credentials, jwtSecret, { expiresIn: "10m" });
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: `${email}`,
                subject: 'Email Verification',
                html: `<p>click to verify : http://localhost:3000/authentication/verify/${token}</p>`
            });
            res.status(200).json({
                msg: 'verify email!!',
            });
        }
        else {
            res.status(400).json({
                msg: "user exits, please login !!"
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(400).json({ msg: "userType not defined" });
    }
});
router.post("/verify/:token", async (req, res) => {
    const token = req.params.token;
    const blackList = new Set();
    try {
        if (blackList.has(token)) {
            res.status(403).json({ msg: "invalid token" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const email = decoded.email;
        blackList.add(token);
        const response = await prisma.users.findUnique({
            where: {
                email: email
            }
        });
        if (!response) {
            res.status(403).json({ msg: "user does not exist" });
        }
        else {
            await prisma.users.update({
                where: {
                    email: email
                },
                data: {
                    is_verified: true
                }
            });
            res.status(200).json({ msg: "email verified !! Please continue to log in" });
        }
    }
    catch (e) {
        console.log(e);
        res.status(400).json({ msg: "unexpected internal error" });
    }
});
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        res.status(400).json({
            msg: "email is required"
        });
    }
    const response = await prisma.users.findUnique({
        where: {
            email
        }
    });
    if (!response) {
        res.status(403).json({
            msg: "user not found"
        });
    }
    const passwordMatch = await bcrypt.compare(password, response === null || response === void 0 ? void 0 : response.password);
    if (passwordMatch) {
        const token = jsonwebtoken_1.default.sign(JSON.stringify({ "email": email }), jwtSecret);
        res.status(200).json({
            msg: "welcome!!",
            token: token
        });
    }
    else {
        res.status(403).json({ msg: "you are not authorized" });
    }
});
module.exports = router;
