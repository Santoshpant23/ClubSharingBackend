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
const nodemailer_1 = __importDefault(require("nodemailer"));
const schemas_1 = require("./schemas");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = process.env.jwtSecret || "random";
const adminEmail = process.env.adminEmail;
const adminPass = process.env.adminPassword;
const adminVerify = express_1.default.Router();
adminVerify.post('/login', (req, res) => {
    try {
        const token = req.body.token;
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const email = data.email;
        const pass = data.password;
        if (email != adminEmail || pass != adminPass) {
            res.json({
                "success": false,
                "message": "Unauthorized Access"
            });
        }
        else {
            res.json({
                "success": true,
                "message": "Welcome Admin"
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
adminVerify.post('/getallpendingusers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allData = yield schemas_1.SchemaForRegister.find({});
        console.log("Data I set back is " + allData);
        res.json({
            "success": true,
            allData
        });
    }
    catch (error) {
        res.json({
            "success": false,
            "message": "Internal Server Error"
        });
    }
}));
adminVerify.post('/approved', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, clubname, password, token, personname, positionOfPerson } = req.body;
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (data.email != adminEmail || data.password != adminPass) {
            return res.json({
                "success": false,
                "message": "Unauthorized Access"
            });
        }
        try {
            const put = new schemas_1.SchemaForClub({ name: clubname, email: email, password: password, description: "", contactEmail: email, personWhoCreated: personname, positionOfPersonWhoCreated: positionOfPerson });
            put.save();
            yield schemas_1.SchemaForRegister.deleteOne({ email: email });
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Internal Server Error"
            });
        }
        try {
            const transporter = yield nodemailer_1.default.createTransport({
                service: 'gmail',
                secure: false,
                auth: {
                    user: process.env.email,
                    pass: process.env.password
                }
            });
            const mailConfigurations = {
                from: process.env.email,
                to: email,
                subject: 'Welcome to ClubSharing',
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
    .button {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      font-size: 1em;
      color: #fff;
      background-color: #28a745;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ClubSharing!</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Congratulations! We are pleased to inform you that your account has been successfully verified. You can now log in using the credentials you provided during the registration process.</p>
      <p>We are excited to have you as part of our community and look forward to seeing you actively participate in our club activities. Here are a few things you can do now:</p>
      <ul>
        <li>Explore and borrow items from other clubs.</li>
        <li>List your club's items for sharing.</li>
        <li>Connect with members from different clubs.</li>
      </ul>
      <p>If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:santoshpant@gmail.com">santoshpant@gmail.com</a>. We're here to help!</p>
      <a href="http://yourwebsite.com/login" class="button">Login to Your Account</a>
    </div>
    <div class="footer">
      <p>Thank you for being a part of our vibrant community.</p>
      <p>Best regards,<br>The ClubSharing Team</p>
    </div>
  </div>
</body>
</html>
`
            };
            yield transporter.sendMail(mailConfigurations, function (error, info) {
                if (error)
                    throw error;
                console.log(info);
            });
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Something is wrong"
            });
        }
        console.log('Finally all good');
        return res.json({
            "success": true,
            "message": "Success"
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
}));
adminVerify.post('/denied', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, token } = req.body;
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const emailofAdminSir = data.email;
        const passofAdmin = data.password;
        if (emailofAdminSir != adminEmail || passofAdmin != adminPass) {
            return res.json({
                "success": false,
                "message": "Unauthorized Access"
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
        const mailConfigurations = {
            // It should be a string of sender/server email 
            from: process.env.email,
            to: email,
            // Subject of Email 
            subject: 'Request Denied',
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
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin-top: 20px;
              font-size: 1em;
              color: #fff;
              background-color: #dc3545;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ClubSharing</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We regret to inform you that we were unable to verify your account at this time.</p>
              <p>If you have any questions or believe this to be an error, please don't hesitate to contact us at <a href="mailto:santoshpant@gmail.com">santoshpant@gmail.com</a>. We are here to assist you.</p>
              <a href="mailto:santoshpant@gmail.com" class="button">Contact Us</a>
            </div>
            <div class="footer">
              <p>Thank you for your understanding.</p>
              <p>Best regards,<br>The ClubSharing Team</p>
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
            console.log(info);
        });
        try {
            yield schemas_1.SchemaForRegister.deleteOne({ email: email });
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Internal Server Error"
            });
        }
        return res.json({
            "success": true,
            "message": "Success"
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
}));
exports.default = adminVerify;
