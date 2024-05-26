"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = __importDefault(require("zod"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const schemas_1 = require("./schemas");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const saltRounds = parseInt(process.env.saltRounds || "10");
//this route will handle all the requests to /register
const registerRouter = express_1.default.Router();
const registerVerify = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string().min(6),
    clubname: zod_1.default.string(),
    personname: zod_1.default.string(),
    positionOfPerson: zod_1.default.string()
});
const sendtoEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const checkEmail = yield schemas_1.SchemaForClub.findOne({ email: email });
        if (checkEmail) {
            return res.json({
                "success": false,
                "message": "User Already Exists"
            });
        }
        const transporter = yield nodemailer_1.default.createTransport({
            service: 'gmail',
            secure: false,
            auth: {
                user: process.env.email,
                pass: process.env.password
            }
        });
        const otp = otp_generator_1.default.generate(6, { upperCaseAlphabets: false, specialChars: false });
        const mailConfigurations = {
            from: process.env.email,
            to: email,
            // Subject of Email 
            subject: 'Email Verification',
            // This would be the text of email body 
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  color: #333;
                  line-height: 1.6;
                }
                .container {
                  width: 80%;
                  margin: auto;
                  padding: 20px;
                  background-color: #fff;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                }
                .header {
                  text-align: center;
                  padding: 10px 0;
                  border-bottom: 1px solid #eee;
                }
                .content {
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  padding: 10px 0;
                  border-top: 1px solid #eee;
                  font-size: 0.9em;
                  color: #777;
                }
                .otp {
                  font-size: 1.5em;
                  color: #007bff;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>ClubSharing</h1>
                </div>
                <div class="content">
                  <p>Hi there,</p>
                  <p>You have recently visited our website and entered your email address. Here is your one-time password (OTP):</p>
                  <p class="otp">${otp}</p>
                  <p>Please do not share this OTP with anyone for security reasons.</p>
                </div>
                <div class="footer">
                  <p>Thank you,</p>
                  <p>The ClubSharing Team</p>
                </div>
              </div>
            </body>
            </html>
            `
        };
        yield transporter.sendMail(mailConfigurations, function (error, info) {
            if (error)
                throw error;
            console.log('Email Sent Successfully');
        });
        try {
            const put = new schemas_1.SchemaForOtp({ email: email, otp: otp });
            put.save();
            next();
        }
        catch (e) {
            res.json({
                "success": false,
                "message": e.message
            });
        }
    }
    catch (e) {
        res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
});
function verifyEmail(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const email = req.body.email;
            const otp = req.body.otp;
            const findIt = yield schemas_1.SchemaForOtp.findOne({ email: email, otp: otp });
            if (findIt) {
                next();
            }
            else {
                return res.json({
                    "success": false,
                    "message": "Invalid Otp, try again"
                });
            }
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Something went wrong"
            });
        }
    });
}
registerRouter.post('/info', sendtoEmail, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({
        "success": true,
        "message": "Email Sent Successfully"
    });
}));
registerRouter.post('/verify', verifyEmail, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, clubname, password, personname, position } = req.body;
        const hasedPass = yield bcrypt_1.default.hash(password, saltRounds);
        console.log(email + " something " + password + " something " + clubname + " something " + personname + " something " + position);
        const verify = registerVerify.safeParse({ email: email, password: hasedPass, clubname: clubname, personname: personname, positionOfPerson: position });
        if (!verify.success) {
            return res.json({ "success": false, "message": "Give all Info Correctly" });
        }
        try {
            const put = new schemas_1.SchemaForRegister({ email: req.body.email, clubname: req.body.clubname, password: hasedPass, personname: req.body.personname, positionOfPerson: req.body.position });
            put.save();
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Server Error"
            });
        }
        res.json({
            "success": true,
            "message": "Otp verified successfully"
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
}));
exports.default = registerRouter;
