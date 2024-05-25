"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//make a server and redirect /register to different page while handle all other routes here
const express_1 = __importDefault(require("express"));
const register_1 = __importDefault(require("./routes/register"));
const adminVerify_1 = __importDefault(require("./routes/adminVerify"));
const user_1 = __importDefault(require("./routes/user"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const mongooDBUrl = process.env.mongoURI || "nothing";
mongoose_1.default.connect(mongooDBUrl);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const port = process.env.PORT;
app.use('/register', register_1.default);
app.use('/admin/verify', adminVerify_1.default);
app.get('/', (req, res) => {
    res.send('Deployed');
});
app.use('/user', user_1.default);
app.listen(port, () => {
    console.log('Server is running on port' + port);
});
