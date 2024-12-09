import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';
dotenv.config();
const express = require("express");
const { prisma } = require('../utils/client');
const router = express.Router();
import { authmiddleware } from '../middlewares/auth';
router.use(express.json());



interface speaker_type {
    expertise?: string,
    session_cost?: Decimal
}

router.post("/setup", authmiddleware, async (req: any, res: any) => {
    try {
        const { expertise, session_cost }: speaker_type = req.body;
        
        const response = await prisma.users.findUnique({
            where: {
                email: req.email.toLowerCase()
            }
        })

        if(response && response.user_type=="speaker"){
            const addSpeaker = await prisma.speakers.upsert({
                where:{
                    user_id : response.user_id
                },
                update:{
                    expertise,
                    session_cost
                },
                create:{
                    user_id : response.user_id,
                    expertise,
                    session_cost
                }
            }).then(()=>{
                res.status(200).json({
                    msg:"session published!!"
                })
            })

            
        }else{
            res.status(500).json({msg:"user email not found"})
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({msg:"updation failed"})

    }



});

router.get("/bulk",async(req:any,res:any)=>{
    const allSpeakers = await prisma.speakers.findMany();
    return res.status(200).json({
        speakers: allSpeakers
    })
})





module.exports = router;
