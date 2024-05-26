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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const schemas_1 = require("./schemas");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = process.env.jwtSecret || "nothing";
//for the club owner to approve or deny rental of their resources
const approveRequest = (0, express_1.default)();
approveRequest.get('/iteminfo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.token;
    const itemId = req.headers.id;
    try {
        console.log("I received id of " + itemId);
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!data) {
            return res.json({
                "success": false,
                "message": "Cannot Authorize Users"
            });
        }
        const findClub = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!findClub) {
            return res.json({
                "success": false,
                "message": "Cannot Find"
            });
        }
        const itemInfo = yield schemas_1.SchemaForApproval.findById({ _id: itemId });
        if (!itemInfo) {
            return res.json({
                "success": false,
                "message": "Cannot find item with this info"
            });
        }
        const itemBooked = yield schemas_1.SchemaFoItem.findOne({ _id: itemInfo.itemId });
        if (!itemBooked) {
            return res.json({
                "success": false,
                "message": "Cannot find item with this info"
            });
        }
        if (itemBooked.email != data.email) {
            return res.json({
                "success": false,
                "message": "Authentication Issues"
            });
        }
        res.json({
            "success": true,
            "info": itemInfo
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
}));
approveRequest.post("/getallpendingrequests", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.body.token;
    try {
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!data) {
            return res.json({
                "success": false,
                "message": "Cannot Authorize Users"
            });
        }
        const findClub = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!findClub) {
            return res.json({
                "success": false,
                "message": "Cannot Find"
            });
        }
        const getAllPendings = findClub.approvalRequests;
        return res.json({
            "success": true,
            "message": "Found",
            pendingRequests: getAllPendings
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something Went Wrong"
        });
    }
}));
approveRequest.post('/approveRequest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, requestId } = req.body;
    try {
        console.log("I got this id from frontend " + requestId);
        const requestingData = yield schemas_1.SchemaForApproval.findById({ _id: requestId });
        if (!requestingData) {
            return res.json({
                "success": false,
                "message": "Request ID is incorrect"
            });
        }
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const club = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!club) {
            return res.json({
                "success": false,
                "message": "Club not found"
            });
        }
        const itemId = requestingData.itemId;
        const findItem = yield schemas_1.SchemaFoItem.findById({ _id: itemId });
        if (!findItem) {
            return res.json({
                "success": false,
                "message": "Something is wrong"
            });
        }
        const findClub = yield schemas_1.SchemaForClub.findOne({ email: findItem.email });
        if (!findClub) {
            return res.json({
                "success": false,
                "message": "Something is wrong"
            });
        }
        const booked = new schemas_1.SchemaForBooking({ requestedFromName: findClub.name, requestedFromEmail: findClub.email, itemName: requestingData.item, itemId: requestingData.itemId, bookedByClubId: requestingData.requestedByClubId, startDate: requestingData.from, endDate: requestingData.to, requestedAt: requestingData.requestedAt, respondedAt: new Date });
        yield booked.save();
        yield schemas_1.SchemaForClub.findOneAndUpdate({ email: requestingData.requestedByEmail }, { $push: { bookings: booked._id } }, { new: true });
        yield schemas_1.SchemaForClub.updateOne({ email: data.email }, { $pull: { approvalRequests: requestId } });
        //send an email to requester here {TODO}
        // ------------------------------------------
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
            to: requestingData.requestedByEmail,
            // Subject of Email 
            subject: 'Your Booking Request Has Been Approved!',
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
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
      .header {
        text-align: center;
        padding: 20px 0;
        background-color: #007bff;
        color: #fff;
        border-radius: 8px 8px 0 0;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
      }
      .content p {
        margin: 0 0 10px;
      }
      .content .highlight {
        font-size: 1.2em;
        color: #007bff;
      }
      .content .details {
        background-color: #f1f1f1;
        padding: 10px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .details p {
        margin: 5px 0;
      }
      .footer {
        text-align: center;
        padding: 20px 0;
        border-top: 1px solid #eee;
        font-size: 0.9em;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>ClubSharing</h1>
      </div>
      <div class="content">
        <p>Hi ${requestingData.requestedByName},</p>
        <p>We are pleased to inform you that your request to book an item has been approved. Here are the details of your booking:</p>
        <div class="details">
          <p><strong>Item Name: </strong> <span class="highlight">${requestingData.item}</span></p>
          <p><strong>From: </strong> ${requestingData.from.toLocaleDateString()}</p>
          <p><strong>To: </strong> ${requestingData.to.toLocaleDateString()}</p>
          <p><strong>Approved On: </strong> ${booked.respondedAt.toLocaleDateString()}</p>
        </div>
        <p>To view more details or manage your booking, please log in to your account on ClubSharing.</p>
        <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
        <p>Thank you for using ClubSharing!</p>
      </div>
      <div class="footer">
        <p>Best regards,</p>
        <p>The ClubSharing Team</p>
        <p><a href="https://clubsharing.com">www.clubsharing.com</a></p>
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
        //---------------------------------------
        res.status(200).json({
            "success": true,
            "message": "Approval Request Approved"
        });
    }
    catch (error) {
        res.json({
            "success": false,
            "message": "Error approving request"
        });
    }
}));
approveRequest.post('/denyRequest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, requestId } = req.body;
    try {
        const requestingData = yield schemas_1.SchemaForApproval.findById({ _id: requestId });
        if (!requestingData) {
            return res.json({
                "success": false,
                "message": "Request ID is incorrect"
            });
        }
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const club = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!club) {
            return res.json({
                "success": false,
                "message": "Club not found"
            });
        }
        const item = yield schemas_1.SchemaFoItem.findOne({ _id: requestingData.itemId });
        if (!item) {
            return res.json({
                "success": false,
                "message": "item id is not correct"
            });
        }
        const isOwner = yield schemas_1.SchemaForClub.findOne({ email: item.email });
        if (!isOwner) {
            return res.json({
                "success": false,
                "message": "Unauthorized Access"
            });
        }
        yield schemas_1.SchemaForClub.updateOne({ email: data.email }, { $pull: { approvalRequests: requestId } });
        yield schemas_1.SchemaForApproval.findOneAndDelete({ _id: requestId });
        //send an email to requester about the update
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
            to: requestingData.requestedByEmail,
            // Subject of Email 
            subject: 'Your Booking Request Has Been Denied',
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
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
      .header {
        text-align: center;
        padding: 20px 0;
        background-color: #d9534f;
        color: #fff;
        border-radius: 8px 8px 0 0;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
      }
      .content p {
        margin: 0 0 10px;
      }
      .content .highlight {
        font-size: 1.2em;
        color: #d9534f;
      }
      .content .details {
        background-color: #f1f1f1;
        padding: 10px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .details p {
        margin: 5px 0;
      }
      .footer {
        text-align: center;
        padding: 20px 0;
        border-top: 1px solid #eee;
        font-size: 0.9em;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>ClubSharing</h1>
      </div>
      <div class="content">
        <p>Hi ${requestingData.requestedByName},</p>
        <p>We regret to inform you that your request to book the following item has been denied:</p>
        <div class="details">
          <p><strong>Item Name: </strong> <span class="highlight">${requestingData.item}</span></p>
          <p><strong>Requested From: </strong> ${requestingData.from.toLocaleDateString()}</p>
          <p><strong>Requested To: </strong> ${requestingData.to.toLocaleDateString()}</p>
        </div>
        <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
        <p>Thank you for understanding, and we hope you continue to use ClubSharing for your future needs.</p>
      </div>
      <div class="footer">
        <p>Best regards,</p>
        <p>The ClubSharing Team</p>
        <p><a href="https://clubsharing.com">www.clubsharing.com</a></p>
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
        res.status(200).json({
            "success": true,
            "message": "Approval request denied"
        });
    }
    catch (error) {
        res.json({
            "success": false,
            "message": "Error denying request"
        });
    }
}));
exports.default = approveRequest;
