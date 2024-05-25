"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaForApproval = exports.SchemaFoItem = exports.SchemaForBooking = exports.SchemaForOtp = exports.SchemaForRegister = exports.SchemaForClub = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
//-->Schema for clubs----------------------------------------------
// Schema for individual items
const ItemSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    available: { type: Boolean, default: true },
    bookedDates: [{
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true }
        }]
});
// Schema for booking details
const BookingSchema = new Schema({
    requestedFromName: { type: String, required: true },
    requestedFromEmail: { type: String, required: true },
    itemName: { type: String, required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    bookedByClubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    requestedAt: { type: Date, required: true },
    respondedAt: { type: Date, required: true }
});
// Schema for item approval requests
const ApprovalRequestSchema = new Schema({
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    item: { type: String, required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    requestedByClubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    requestedAt: { type: Date, default: Date.now },
});
// Schema for a club
const ClubSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String },
    contactEmail: { type: String, required: true },
    personWhoCreated: { type: String, required: true },
    positionOfPersonWhoCreated: { type: String, required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }], // Use references
    bookings: [{ type: Schema.Types.ObjectId, ref: 'ApprovalItems' }], //aru ko k k book gareko chu maile ani will decide when to return those items
    approvalRequests: [{ type: Schema.Types.ObjectId, ref: 'Booking' }]
}, {
    timestamps: true
});
// Creating models
const Club = mongoose_1.default.model('Club', ClubSchema);
const Item = mongoose_1.default.model('Item', ItemSchema);
const Booking = mongoose_1.default.model('Booking', BookingSchema);
const ApprovalItems = mongoose_1.default.model('ApprovalItems', ApprovalRequestSchema);
//--------->...............................................................
const registerSchema = new mongoose_1.default.Schema({
    clubname: String,
    email: String,
    password: String,
    personname: String,
    positionOfPerson: String
});
const otpSchema = new mongoose_1.default.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, expires: '1m', default: Date.now }
});
const OTP = mongoose_1.default.model('otps', otpSchema);
const Register = mongoose_1.default.model('register', registerSchema);
// module.exports = { Club, Item, Booking, OTP, Register};
exports.SchemaForClub = Club;
exports.SchemaForRegister = Register;
exports.SchemaForOtp = OTP;
exports.SchemaForBooking = Booking;
exports.SchemaFoItem = Item;
exports.SchemaForApproval = ApprovalItems;
