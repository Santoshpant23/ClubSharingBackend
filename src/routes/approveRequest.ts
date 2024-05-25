import express from 'express';
import jwt from 'jsonwebtoken';
import { SchemaFoItem, SchemaForApproval, SchemaForBooking, SchemaForClub} from './schemas';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY  = process.env.jwtSecret || "nothing";

//for the club owner to approve or deny rental of their resources
const approveRequest = express();


approveRequest.get('/iteminfo', async (req, res)=>{
  const token = req.headers.token as string;
  const itemId = req.headers.id as string;
  try{
    console.log("I received id of " + itemId);
    
    const data = jwt.verify(token, SECRET_KEY) as {email: string};
    if(!data){
      return res.json({
        "success": false,
        "message": "Cannot Authorize Users"
      })
    }

    const findClub = await SchemaForClub.findOne({email: data.email});
    if(!findClub){
      return res.json({
        "success": false,
        "message": "Cannot Find"
      })
    }

    const itemInfo = await SchemaForApproval.findById({_id:itemId});
    if(!itemInfo){
      return res.json({
        "success": false,
        "message": "Cannot find item with this info"
      })
    }

    const itemBooked = await SchemaFoItem.findOne({_id: itemInfo.itemId});

    if(!itemBooked){
      return res.json({
        "success": false,
        "message": "Cannot find item with this info"
      })
    }

    if(itemBooked.email !=data.email){
      return res.json({
        "success": false,
        "message": "Authentication Issues"
      })
    }

    res.json({
      "success": true,
      "info": itemInfo
    })

  }catch(e){

  }

})

approveRequest.post("/getallpendingrequests", async (req, res)=>{
  const token = req.body.token;

  try{
    const data = jwt.verify(token, SECRET_KEY) as {email: string};
    if(!data){
      return res.json({
        "success": false,
        "message": "Cannot Authorize Users"
      })
    }

    const findClub = await SchemaForClub.findOne({email: data.email});
    if(!findClub){
      return res.json({
        "success": false,
        "message": "Cannot Find"
      })
    }

    const getAllPendings = findClub.approvalRequests;

    return res.json({
      "success": true,
      "message": "Found",
      pendingRequests: getAllPendings
    })

  } catch(e){
    return res.json({
      "success": false,
      "message": "Something Went Wrong"
    })
  }
})

approveRequest.post('/approveRequest', async (req, res) => {
    const { token, requestId } = req.body;
  
    try {
      console.log("I got this id from frontend " + requestId);
      
      const requestingData = await SchemaForApproval.findById({_id:requestId});
      if(!requestingData){
        return res.json({
          "success": false,
          "message": "Request ID is incorrect"
        })
      }
      
      const data = jwt.verify(token, SECRET_KEY) as { email: string, password: string };
      const club = await SchemaForClub.findOne({ email: data.email});
  
      if (!club) {
        return res.json({ 
          "success":false,
          "message": "Club not found"
         });
      }
      
      const itemId = requestingData.itemId;

      const findItem =  await SchemaFoItem.findById({_id: itemId});
      if(!findItem){
        return res.json({
          "success": false,
          "message": "Something is wrong"
        })
      }
      
      const findClub = await SchemaForClub.findOne({email: findItem.email});
      if(!findClub){
        return res.json({
          "success": false,
          "message": "Something is wrong"
        })
      }

      

      const booked = new SchemaForBooking({requestedFromName: findClub.name, requestedFromEmail: findClub.email, itemName: requestingData.item, itemId: requestingData.itemId, bookedByClubId: requestingData.requestedByClubId, startDate: requestingData.from, endDate: requestingData.to, requestedAt: requestingData.requestedAt, respondedAt: new Date});

     await  booked.save();

      await SchemaForClub.findOneAndUpdate({email: requestingData.requestedByEmail},
         {$push : {bookings: booked._id}},
         {new: true}
        )
        await SchemaForClub.updateOne({email: data.email}, { $pull: {approvalRequests: requestId} });

        //send an email to requester here {TODO}
        // ------------------------------------------

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
        
    await  transporter.sendMail(mailConfigurations, function(error, info){ 
          if (error) throw error; 
          console.log('Email Sent Successfully'); 
      }); 

      //---------------------------------------
      res.status(200).json({
        "success": true,
         "message": "Approval Request Approved"
         });
    } catch (error) {
      res.json({
        "success": false,
        "message": "Error approving request"});
    }
  });

  
  approveRequest.post('/denyRequest', async (req, res) => {
    const { token, requestId } = req.body;
  
    try {
      const requestingData = await SchemaForApproval.findById({_id:requestId});
      if(!requestingData){
        return res.json({
          "success": false,
          "message": "Request ID is incorrect"
        })
      }
      const data = jwt.verify(token, SECRET_KEY) as { email: string, password: string };
      const club = await SchemaForClub.findOne({ email: data.email});
  
      if (!club) {
        return res.json({ 
          "success":false,
          "message": "Club not found"
         });
      }
      const item = await SchemaFoItem.findOne({_id: requestingData.itemId});
      if(!item){
        return res.json({
          "success": false,
          "message": "item id is not correct"
        })
      }

      const isOwner = await SchemaForClub.findOne({email: item.email});

      if (!isOwner) {
        return res.json({
          "success": false,
           "message": "Unauthorized Access"
           });
      }

      await SchemaForClub.updateOne({email: data.email}, { $pull: {approvalRequests: requestId} });


      await SchemaForApproval.findOneAndDelete({_id: requestId});
  
      //send an email to requester about the update
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
      
  await  transporter.sendMail(mailConfigurations, function(error, info){ 
        if (error) throw error; 
        console.log('Email Sent Successfully'); 
    }); 

      res.status(200).json({ 
        "success": true,
        "message": "Approval request denied"});
    } catch (error) {
      res.json({
        "success": false,
        "message": "Error denying request" });
    }
  });
  

export default approveRequest;