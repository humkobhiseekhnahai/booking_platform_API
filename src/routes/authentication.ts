import dotenv from 'dotenv';
dotenv.config(); 
import express, { response } from "express"
const { prisma } = require('../utils/client');
import jwt from "jsonwebtoken";
import { Resend } from 'resend';
import { JwtPayload } from 'jsonwebtoken';


const resend = new Resend(process.env.RESEND_API_KEY);
const router = express.Router();
const bcrypt = require("bcrypt");
const jwtSecret = process.env.JWT_SECRET_KEY;


router.use(express.json());

if(!jwtSecret){
    throw new Error("jwtSecret is not defined");
}

enum userType{
    speaker = 'speaker',
    user = 'user'
}

router.post("/signup",async(req,res)=>{


    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email= req.body.email;
    const password = req.body.password;
    const user_type : userType = req.body.user_type as userType;


    try{

        const find = await prisma.users.findUnique({
            where:{
                email
            }  
        });
    
        if(!find){
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password,saltRounds);

            const response = await prisma.users.create({
                data:{
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: hashedPassword,
                    user_type: user_type
                }
            })
            
            const credentials = {
                "email" : email,
            };

            const token = jwt.sign(credentials,jwtSecret,{expiresIn:"10m"});
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: `${email}`,
                subject: 'Email Verification',
                html: `<p>send a POST request to : http://localhost:3000/authentication/verify/${token}</p>`
              });

            res.status(200).json({
                msg:'verify email!!',
            });
    
    
        }else{
                res.status(400).json({
                    msg:"user exits, please login !!"
                });
        }
        
    
    }catch(e){
        console.log(e);
        res.status(400).json({msg:"userType not defined"})
    }

    

})

router.post("/verify/:token",async(req,res)=>{
    const token = req.params.token as string; 
    const blackList : Set<string> = new Set();

    interface token_type extends JwtPayload{
        email: string
    }

    try{
        if(blackList.has(token)){
            res.status(403).json({msg:"invalid token"})
        }

        const decoded = jwt.verify(token, jwtSecret) as token_type;
        const email = decoded.email

        blackList.add(token)

        const response = await prisma.users.findUnique({
            where:{
                email: email
            }
        })

        if(!response){
            res.status(403).json({msg:"user does not exist"})
        }else{
            await prisma.users.update({
                where:{
                    email: email
                },
                data:{
                    is_verified: true
                }
            })
            res.status(200).json({msg:"email verified !! Please continue to log in"})
        }

    }catch(e){
        console.log(e);
        res.status(400).json({msg:"unexpected internal error"})
    }
    
})

router.post("/signin",async(req,res)=>{
    const {email, password} = req.body;
    if(!email){
        res.status(400).json({
            msg:"email is required"
        })
    }

    const response = await prisma.users.findUnique({
        where:{
            email
        }
    });

    if(!response){
        res.status(403).json({
            msg:"user not found"
        })
    }

    const passwordMatch = await bcrypt.compare(password,response?.password);

    if(passwordMatch){
        const token = jwt.sign(JSON.stringify({"email":email}),jwtSecret);
        res.status(200).json({
            msg:"welcome!!",
            token:token
        })
    }else{
        res.status(403).json({msg:"you are not authorized"})
    }

    
})


module.exports = router;