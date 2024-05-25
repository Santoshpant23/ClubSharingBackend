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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const schemas_1 = require("./schemas");
const approveRequest_1 = __importDefault(require("./approveRequest"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SECRET_KEY = process.env.jwtSecret || "nothing";
const adminEmail = process.env.adminEmail;
const adminPass = process.env.adminPassword;
const userRouter = express_1.default.Router();
userRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = req.body.email;
    const password = req.body.password;
    if (email == adminEmail && password == adminPass) {
        const token = jsonwebtoken_1.default.sign({ email, password }, SECRET_KEY);
        return res.json({
            token: token,
            "message": "Success, Welcome Admin",
            "success": true
        });
    }
    const user = yield schemas_1.SchemaForClub.findOne({ email: email });
    if (!user || !user.password) {
        return res.json({
            "success": false,
            "msg": "User Not Found"
        });
    }
    const comp = yield bcrypt_1.default.compare(password, (_a = user === null || user === void 0 ? void 0 : user.password) !== null && _a !== void 0 ? _a : "");
    if (!comp) {
        return res.json({
            "message": "User Does Not Exist, Please Register",
            "success": false
        });
    }
    //will send jwt
    const tokenSign = jsonwebtoken_1.default.sign({ email, password }, SECRET_KEY);
    return res.status(200).json({
        "token": tokenSign,
        "message": "Successfully logged in",
        "success": true
    });
}));
userRouter.get('/getitem', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.headers.id;
    try {
        const getItem = yield schemas_1.SchemaFoItem.findById({ _id: id });
        res.json({
            "success": true,
            getItem
        });
    }
    catch (e) {
        res.json({
            "success": false,
            "message": "Cannot find an item"
        });
    }
}));
userRouter.get('/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.token;
    const data = yield jsonwebtoken_1.default.verify(token, SECRET_KEY);
    if (!data) {
        return res.json({
            "success": false,
            "message": "Unauthorized Access"
        });
    }
    try {
        const clubDetails = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        console.log("Found clubDetais");
        res.json({
            "success": true,
            clubDetails
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "something went wrong in database"
        });
    }
}));
userRouter.get('/getallclubs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const data = jwt.verify(token, SECRET_KEY);
        //will verify it later
        console.log("Inside getallclubs");
        const response = yield schemas_1.SchemaForClub.find({});
        return res.status(200).json({
            "success": true,
            response
        });
    }
    catch (error) {
        return res.json({
            "success": false,
            "message": "Cannot Get Data, try again"
        });
    }
}));
userRouter.get('/getclubinfo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.headers.idofitem;
    try {
        console.log("This is club id " + id);
        const item = yield schemas_1.SchemaForClub.findById({ _id: id });
        res.json({
            "success": true,
            item
        });
    }
    catch (e) {
        res.json({
            "success": false,
            "message": "Item Does Not Exist Anymore"
        });
    }
}));
userRouter.post('/additem', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { token, name, description, quantity, available, bookedDates } = req.body;
    console.log("All Items found");
    try {
        // Verify the token
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const email = data.email;
        const pass = data.password;
        console.log("Email and password of user requesting is " + email + " " + pass);
        // Create new item
        const addItem = new schemas_1.SchemaFoItem({
            name: name,
            email: email,
            description: description || "No Description Provided by admin",
            quantity: quantity || 1,
            available: available !== undefined ? available : true,
            bookedDates: bookedDates || []
        });
        // Save item to the database
        console.log("All good, item saved , now trying to append in club");
        // Find club by email
        const userData = yield schemas_1.SchemaForClub.findOne({ email: email });
        if (!userData) {
            return res.status(404).json({ message: "Club not found" });
        }
        console.log("Club found with this jwt");
        const passFromUser = (_b = userData.password) !== null && _b !== void 0 ? _b : "";
        const comp = yield bcrypt_1.default.compare(pass, passFromUser);
        if (!comp) {
            return res.json({
                "success": false,
                "message": "Unauthorized Access"
            });
        }
        console.log("Was authorized access");
        // Add item to club's items array
        yield addItem.save();
        const updatedClub = yield schemas_1.SchemaForClub.findOneAndUpdate({ email: email, password: passFromUser }, { $push: { items: addItem._id } }, { new: true } // Return the updated document
        );
        if (!updatedClub) {
            return res.json({
                "success": false,
                "message": "Club not found or update failed"
            });
        }
        // addItem.save();
        console.log("Finally, all was good");
        res.status(200).json({
            "success": true,
            "message": "Item added successfully", club: updatedClub
        });
    }
    catch (error) {
        res.json({
            "success": false,
            "message": "Error adding item", error
        });
    }
}));
//will do from here tomorrow
userRouter.post('/deleteItem', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { token, id } = req.body;
    try {
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!data) {
            return res.json({
                "success": false,
                "message": "Cannot verify user"
            });
        }
        const email = data.email;
        const pass = data.password;
        // Find the club by email
        const userData = yield schemas_1.SchemaForClub.findOne({ email: email });
        if (!userData) {
            return res.status(404).json({
                "success": false,
                "message": "Club not found"
            });
        }
        const passFromUser = (_c = userData.password) !== null && _c !== void 0 ? _c : "";
        const comp = yield bcrypt_1.default.compare(pass, passFromUser);
        if (!comp) {
            return res.status(401).json({
                "success": false,
                "message": "Unauthorized Access"
            });
        }
        const findItem = yield schemas_1.SchemaFoItem.findById({ _id: id });
        if (!findItem) {
            return res.json({
                "success": false,
                "message": "Cannot find the item you wanted to delete"
            });
        }
        const emailOfItem = findItem.email;
        if (emailOfItem != email) {
            return res.json({
                "success": false,
                "message": "You are not authorized to delete this item"
            });
        }
        yield schemas_1.SchemaFoItem.findByIdAndDelete(id);
        yield schemas_1.SchemaForClub.updateOne({ _id: userData._id }, { $pull: { items: id } });
        res.status(200).json({
            "success": true,
            "message": "Item deleted successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            "success": false,
            "message": "Error deleting item"
        });
    }
}));
userRouter.put('/edit-item', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, name, description, quantity, available, bookedDates, id } = req.body;
        const verify = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!verify) {
            return res.json({
                "success": false,
                "message": "Unauthorized Action"
            });
        }
        console.log(id + " is the id");
        const isItem = yield schemas_1.SchemaFoItem.findById({ _id: id });
        if (!isItem) {
            return res.json({
                "success": false,
                "message": "Item does not exist"
            });
        }
        if (isItem.email != verify.email) {
            return res.json({
                "success": false,
                "message": "Unauthorized User"
            });
        }
        const updatedItem = yield schemas_1.SchemaFoItem.findByIdAndUpdate(id, { name, description, quantity, available, bookedDates }, { new: true, runValidators: true });
        // updatedItem.save();
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
userRouter.post('/requestApproval', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, itemId } = req.body;
    const from = req.body.from;
    const to = req.body.to;
    try {
        console.log("Reached inside request approval");
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        const requestingClub = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!requestingClub) {
            return res.json({
                "success": false,
                "message": "Club not found"
            });
        }
        const item = yield schemas_1.SchemaFoItem.findById({ _id: itemId });
        if (!item) {
            return res.json({
                "success": false,
                "message": "Item does not exist"
            });
        }
        try {
            const bookItem = new schemas_1.SchemaForApproval({ requestedByName: requestingClub.name, requestedByEmail: requestingClub.email, item: item.name, itemId: itemId, requestedByClubId: requestingClub._id, from: from, to: to, requestedAt: new Date });
            console.log("Item put in the approval schema");
            console.log("ID is " + bookItem._id);
            const putBookingReqInClub = yield schemas_1.SchemaForClub.findOneAndUpdate({ email: item.email }, { $push: { approvalRequests: bookItem._id } }, { new: true });
            yield bookItem.save();
            if (!putBookingReqInClub) {
                return res.json({
                    "success": false,
                    "message": "Cannot put the booking request to respective club"
                });
            }
            const email = item.email;
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
                // Subject of Email 
                subject: 'Item Booking Request',
                html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
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
                  <p>Hi there,</p>
                  <p>We are excited to inform you that someone is interested in renting one of your items. Here are the details:</p>
                  <div class="details">
                    <p><strong>Item Name: </strong> <span class="highlight">${item.name}</span></p>
                    <p><strong>Requested By: </strong> ${requestingClub.name}</p>
                    <p><strong>Email: </strong>${requestingClub.email}</p>
                    <p><strong>Requested Dates: </strong> From ${new Date(from).toLocaleDateString()} to ${new Date(to).toLocaleDateString()}</p>
                  </div>
                  <p>To proceed with this request, please log in to your account and either accept or decline the booking request. Your prompt response is highly appreciated.</p>
                  <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
                  <p>Thank you for being a valued member of ClubSharing!</p>
                </div>
                <div class="footer">
                  <p>Best regards,</p>
                  <p>The ClubSharing Team</p>
                  <p><a href="https://clubsharing.com">www.clubsharing.com</a></p>
                </div>
              </div>
            </body>
            </html>`
            };
            yield transporter.sendMail(mailConfigurations, function (error, info) {
                if (error) {
                    console.log("Error Occured " + error.message);
                    return;
                }
                ;
                console.log('Email Sent Successfully');
            });
            console.log("Email Send vayo hai ta");
            return res.json({
                "success": true,
                "message": "Success"
            });
        }
        catch (e) {
            return res.json({
                "success": false,
                "message": "Cannot Book Item, try again"
            });
        }
    }
    catch (error) {
        res.json({
            "success": false,
            "message": "Error submitting approval request"
        });
    }
}));
userRouter.get('/getbookeditems', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.token;
    try {
        const data = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!data) {
            return res.json({
                "success": false,
                "message": "Invalid User"
            });
        }
        const findClub = yield schemas_1.SchemaForClub.findOne({ email: data.email });
        if (!findClub) {
            return res.json({
                "success": false,
                "message": "Cannot find your club"
            });
        }
        return res.json({
            "success": true,
            items: findClub.bookings
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong"
        });
    }
}));
userRouter.post('/returnitem', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.body.token;
    const itemId = req.body.itemId;
    try {
        const verify = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!verify) {
            return res.json({
                "success": false,
                "message": "Unauthorized Action"
            });
        }
        console.log("Verified jwt");
        const findBooking = yield schemas_1.SchemaForBooking.findById({ _id: itemId });
        if (!findBooking) {
            return res.json({
                "success": false,
                "message": "Booking no longer exist!!!"
            });
        }
        console.log("Booking found");
        const findClub = yield schemas_1.SchemaForClub.findById({ _id: findBooking.bookedByClubId });
        if (!findClub) {
            return res.json({
                "success": false,
                "message": "Unauthorized Action!!"
            });
        }
        console.log("Club found");
        yield schemas_1.SchemaForClub.findByIdAndUpdate({ _id: findBooking.bookedByClubId }, { $pull: { bookings: itemId } });
        console.log("Club updated");
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
            to: findBooking.requestedFromEmail,
            // Subject of Email 
            subject: 'Item Return Notification',
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
              <p>Hi ${findBooking.requestedFromName},</p>
              <p>We wanted to inform you that the item <span class="highlight">${findBooking.itemName}</span> rented by <strong>${findClub.name}</strong> has been marked as returned.</p>
              <div class="details">
                <p><strong>Item Name: </strong> <span class="highlight">${findBooking.itemName}</span></p>
                <p><strong>Rented By: </strong> ${findClub.name}</p>
                <p><strong>Rented On: </strong> ${findBooking.startDate.toLocaleDateString()}</p>
                <p><strong>Returned On: </strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Renter's Email: </strong> ${findClub.email}</p>
              </div>
              <p>If the item has not been returned, please contact the renter directly at ${findClub.email}.</p>
              <p>Otherwise, no further action is needed on your part.</p>
            </div>
            <div class="footer">
              <p>Thank you for using ClubSharing!</p>
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
        console.log("Email sent");
        return res.json({
            "success": true,
            "message": "Success"
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something went wrong, try again"
        });
    }
}));
userRouter.get('/getbookeditemdetails', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const itemId = req.headers.id;
    try {
        const getItem = yield schemas_1.SchemaForBooking.findOne({ _id: itemId });
        if (!getItem) {
            return res.json({
                "success": false,
                "message": "Cannot fine the given item"
            });
        }
        return res.json({
            "success": true,
            "message": "Success",
            getItem
        });
    }
    catch (e) {
        return res.json({
            "success": false,
            "message": "Something wrong with backend, try again!"
        });
    }
}));
userRouter.use('/request', approveRequest_1.default);
exports.default = userRouter;
