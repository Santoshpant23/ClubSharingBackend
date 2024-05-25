import express from 'express';
import nodemailer from 'nodemailer';
import { SchemaForClub, SchemaForRegister } from './schemas';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.jwtSecret || "random";
const adminEmail = process.env.adminEmail;
const adminPass = process.env.adminPassword;



const adminVerify = express.Router();

adminVerify.post('/login', (req, res)=>{
const token = req.body.token;
const data = jwt.verify(token, SECRET_KEY) as { email: string, password: string };
    const email = data.email;
    const pass = data.password;
    if(email!=adminEmail || pass!=adminPass){
        res.json({
            "success": false,
            "message": "Unauthorized Access"
        })
    } else{
        res.status(200).json({
            "success": true,
            "message": "Welcome Admin"
        }) 
    }
})

adminVerify.post('/getallpendingusers', async (req, res) => {
    try {
        const allData = await SchemaForRegister.find({});
        console.log("Data I set back is "+ allData);
        
        res.json({
          "success": true,
          allData
        });
    } catch (error) {
        res.json({
            "success": false,
            "message": "Internal Server Error"
        });
    }
});

adminVerify.post('/approved', async (req, res)=>{
    const {email, clubname, password, token, personname, positionOfPerson} = req.body;
    const data = jwt.verify(token, SECRET_KEY) as { email: string, password: string };
    
    if(data.email!=adminEmail || data.password!=adminPass){
      return   res.status(401).json({
            "success": false,
            "message": "Unauthorized Access"
        })
    }
    
    try{
        const put = new SchemaForClub({name: clubname, email:email, password: password, description: "" , contactEmail: email, personWhoCreated: personname, positionOfPersonWhoCreated: positionOfPerson});
        
    put.save();
    await SchemaForRegister.deleteOne({email:email});
  
    
    } catch(e){
     
        
        return res.json({
          "success": false,
            "message": "Internal Server Error"
        })
    }
    try{
    
        
        const transporter = await nodemailer.createTransport({ 
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

        await  transporter.sendMail(mailConfigurations, function(error, info){ 
            if (error) throw error; 
            console.log(info); 
        }); 

    } catch(e){
        
       return res.json({
        "success": false,
            "message": "Something is wrong"
        })
    }
    console.log('Finally all good');
    
  return  res.json({
    "success": true,
        "message": "Success"
    })

})

adminVerify.post('/denied', async (req, res)=>{
    const {email, token} = req.body;
    const data = jwt.verify(token, SECRET_KEY) as { email: string, password: string };
    const emailofAdminSir = data.email;
    const passofAdmin = data.password;
    if(emailofAdminSir!=adminEmail || passofAdmin!=adminPass){
      return  res.json({
            "success": false,
            "message": "Unauthorized Access"
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

    await  transporter.sendMail(mailConfigurations, function(error, info){ 
        if (error) throw error; 
        console.log('Email Sent Successfully'); 
        console.log(info); 
    }); 

    try{
        await SchemaForRegister.deleteOne({email:email});
    } catch(e){
        return res.json({
          "success": false,
            "message":"Internal Server Error"
        })
    }

   return res.json({
    "success": true,
        "message": "Success"
    })
})

export default adminVerify;