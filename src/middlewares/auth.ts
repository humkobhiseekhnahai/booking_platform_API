import dotenv from "dotenv";
dotenv.config();
const express = require("express");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET_KEY
const app = express();
const { prisma } = require("../utils/client")


app.use(express.json());

export async function authmiddleware(req: any,res: any,next: any){
    console.log(jwtSecret);
    const header = req.headers.authorization;
    if(!header || !header.startsWith('Bearer')){
        res.status(403).json({
            msg:"incorrect authentication header"
        })
    }

    const authHeader = header.split(" ");
    const token = authHeader[1];

    try {
        const verify = jwt.verify(token,jwtSecret);
        if(!verify){
            return res.status(403).json({
                msg:"authentication failed"
            })
        }else{
            const check = await prisma.users.findUnique({
                where:{
                    email: verify.email
                }
            })

            if(check.is_verified==true){
                req.email = verify.email;
                req.user_id = check.user_id
                next()
            }else{
                return res.status(403).json({msg:"verify your email first"})
            }
            
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({msg: "error in auth header"})
    }
    
}

