import express from "express";
import zod, { ZodCatch, string } from "zod";
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import bcrypt from 'bcrypt';
import {SchemaForClub, SchemaForOtp, SchemaForRegister} from './schemas';
import dotenv from 'dotenv';
dotenv.config();

const saltRounds: number = parseInt(process.env.saltRounds || "10");


//this route will handle all the requests to /register
const registerRouter = express.Router();

const registerVerify = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6),
    clubname: zod.string(),
    personname: zod.string(),
    positionOfPerson: zod.string()
    });

    const sendtoEmail = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const email = req.body.email;
        const checkEmail = await SchemaForClub.findOne({email:email});
        if(checkEmail){
            return res.json({
              "success": false,
                "message": "User Already Exists"
            })
        }
        const transporter = await nodemailer.createTransport({ 
            service: 'gmail', 
            secure: false,
            auth: { 
                user: process.env.email, 
                pass: process.env.password
            } 
        }); 
          
        const otp =  otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });  
    
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
          
      await  transporter.sendMail(mailConfigurations, function(error, info){ 
            if (error) throw error; 
            console.log('Email Sent Successfully'); 
        }); 
        try{
            const put = new SchemaForOtp({email: email, otp: otp});
            put.save();
            next();
        } catch(e: any){
            res.json({
              "success": false,
                "message": e.message
            })
        }
        
    }


    async function verifyEmail(req:express.Request, res: express.Response, next: express.NextFunction){
        const email = req.body.email;
        const otp = req.body.otp;                          
        const findIt = await SchemaForOtp.findOne({email: email, otp: otp});
        
        if(findIt){
            next();
        } else {
            res.json({
              "success": false,
            "message": "Invalid Otp, try again"
        })
    }
    }



registerRouter.post('/info', sendtoEmail,   async (req, res) => {
    res.json({
        "success": true,
       "message" : "Email Sent Successfully"
    });
});

registerRouter.post('/verify', verifyEmail,   async (req, res) => {
    const {email, clubname, password, personname, position} = req.body;
    const hasedPass = await bcrypt.hash(password, saltRounds) 
    console.log(email + " something "+ password + " something "+ clubname+" something "+ personname+ " something "+ position);
    
    const verify = registerVerify.safeParse({email: email, password: hasedPass, clubname: clubname, personname: personname, positionOfPerson: position});
 
    
    if(!verify.success){
        return res.json({"success": false, "message": "Give all Info Correctly"})
    }
    try{
        const put = new SchemaForRegister({email: req.body.email, clubname: req.body.clubname, password: hasedPass, personname: req.body.personname, positionOfPerson: req.body.position });
        put.save();
    } catch(e){
        return res.json({
          "success": false,
          "message": "Server Error"
        })
    }
   
    res.json({
        "success": true,
       "message" : "Otp verified successfully"
    });
});
export default registerRouter;
