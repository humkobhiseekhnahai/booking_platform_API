"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express = require("express");
const { prisma } = require('../utils/client');
const router = express.Router();
const auth_1 = require("../middlewares/auth");
router.use(express.json());
router.post("/setup", auth_1.authmiddleware, async (req, res) => {
    try {
        const { expertise, session_cost } = req.body;
        const response = await prisma.users.findUnique({
            where: {
                email: req.email.toLowerCase()
            }
        });
        if (response && response.user_type == "speaker") {
            const addSpeaker = await prisma.speakers.upsert({
                where: {
                    user_id: response.user_id
                },
                update: {
                    expertise,
                    session_cost
                },
                create: {
                    user_id: response.user_id,
                    expertise,
                    session_cost
                }
            }).then(() => {
                res.status(200).json({
                    msg: "session published!!"
                });
            });
        }
        else {
            res.status(500).json({ msg: "user email not found" });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ msg: "updation failed" });
    }
});
router.get("/bulk", async (req, res) => {
    const allSpeakers = await prisma.speakers.findMany();
    return res.status(200).json({
        speakers: allSpeakers
    });
});
module.exports = router;
