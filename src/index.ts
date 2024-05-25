//make a server and redirect /register to different page while handle all other routes here
import express from 'express';
import registerRouter from './routes/register';
import adminVerify from './routes/adminVerify';
import userRouter from './routes/user';
import cors from 'cors';
import dotenv from 'dotenv'
import mongoose from 'mongoose';
dotenv.config();

const mongooDBUrl = process.env.mongoURI || "nothing";

mongoose.connect(mongooDBUrl);

const app = express();
app.use(express.json());
app.use(cors())
const port = process.env.PORT;

app.use('/register', registerRouter);

app.use('/admin/verify', adminVerify);

app.get('/', (req, res) => {
    res.send('Deployed');
});

app.use('/user', userRouter);

app.listen(port, ()=>{
    console.log('Server is running on port' + port);   
});