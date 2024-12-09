"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const resend_1 = require("resend");
const calender_1 = __importDefault(require("./calender"));
const { prisma } = require('../utils/client');
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/book-session', auth_1.authmiddleware, async (req, res) => {
    var _a;
    try {
        const { speaker_id, date, time } = req.body;
        const user_id = req.user_id;
        if (!speaker_id || !date || !time) {
            return res.status(400).json({ msg: 'speaker_id, date, and time are required fields.' });
        }
        // Create start and end datetime 
        const startDateTime = new Date(`${date}T${time}:00.000Z`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);
        console.log('Searching for slot with parameters:', {
            speaker_id,
            startDateTime,
            endDateTime
        });
        const availableSlot = await prisma.slots.findFirst({
            where: {
                speaker_id: speaker_id,
                start_time: {
                    gte: new Date(startDateTime.setHours(startDateTime.getHours() - 1)),
                    lt: new Date(startDateTime.setHours(startDateTime.getHours() + 2))
                },
                is_booked: false
            }
        });
        if (!availableSlot) {
            console.error('No slots found with criteria:', {
                speaker_id,
                start_time_range: {
                    min: new Date(startDateTime.setHours(startDateTime.getHours() - 1)),
                    max: new Date(startDateTime.setHours(startDateTime.getHours() + 2))
                }
            });
            const allSlots = await prisma.slots.findMany({
                where: {
                    speaker_id: speaker_id
                }
            });
            console.log('All slots for this speaker:', allSlots);
            return res.status(400).json({
                msg: 'No available slots for this time.',
                details: {
                    speaker_id,
                    searchDateTime: startDateTime,
                    allSlots: allSlots
                }
            });
        }
        // Create the booking
        const booking = await prisma.bookings_table.create({
            data: {
                user_id,
                slot_id: availableSlot.slot_id,
            },
            include: {
                slot: {
                    include: {
                        speaker: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        // Mark the slot as booked
        await prisma.slots.update({
            where: {
                slot_id: availableSlot.slot_id,
            },
            data: {
                is_booked: true,
            },
        });
        const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        const speakerEmail = await prisma.speakers.findUnique({
            where: {
                speaker_id: speaker_id
            },
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });
        const userEmail = await prisma.users.findUnique({
            where: {
                user_id: req.user_id
            },
            select: {
                email: true
            }
        });
        // Sending email to the speaker
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: (_a = speakerEmail === null || speakerEmail === void 0 ? void 0 : speakerEmail.user) === null || _a === void 0 ? void 0 : _a.email,
            subject: 'Booking update',
            html: `<p>${user_id} has booked slot ${availableSlot.slot_id}!</p>`
        });
        // Sending email to the user
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail === null || userEmail === void 0 ? void 0 : userEmail.email,
            subject: 'Booking confirmation',
            html: `<p>Slot ${availableSlot.slot_id} successfully booked!</p>`
        });
        //creating event
        await (0, calender_1.default)({ startTime: startDateTime, endTime: endDateTime });
        res.status(201).json({
            msg: 'Session booked successfully!',
            booking,
        });
    }
    catch (error) {
        console.error('Error booking session:', error);
        res.status(500).json({
            msg: 'Booking failed',
            error: error instanceof Error ? error.message : error
        });
    }
});
router.post('/create-slots', auth_1.authmiddleware, async (req, res) => {
    try {
        const { speaker_id, date, start_times } = req.body;
        // Validate input
        if (!speaker_id || !date || !start_times || start_times.length === 0) {
            return res.status(400).json({ msg: 'speaker_id, date, and start_times are required.' });
        }
        // Create slots for the specified date and times
        const slotsToCreate = start_times.map(time => {
            const startDateTime = new Date(`${date}T${time}:00.000Z`);
            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(endDateTime.getHours() + 1);
            return {
                speaker_id,
                start_time: startDateTime,
                end_time: endDateTime,
                is_booked: false
            };
        });
        // Batch create slots
        const createdSlots = await prisma.slots.createMany({
            data: slotsToCreate,
            skipDuplicates: true // Prevent duplicate slot creation
        });
        res.status(201).json({
            msg: 'Slots created successfully!',
            createdSlots
        });
    }
    catch (error) {
        console.error('Error creating slots:', error);
        res.status(500).json({
            msg: 'Slot creation failed',
            error: error instanceof Error ? error.message : error
        });
    }
});
// Helper route to check existing slots for a speaker
router.get('/speaker-slots/:speaker_id', auth_1.authmiddleware, async (req, res) => {
    try {
        const speaker_id = parseInt(req.params.speaker_id);
        const slots = await prisma.slots.findMany({
            where: {
                speaker_id: speaker_id
            },
            orderBy: {
                start_time: 'asc'
            }
        });
        res.status(200).json({
            msg: 'Slots retrieved successfully',
            slots
        });
    }
    catch (error) {
        console.error('Error retrieving slots:', error);
        res.status(500).json({
            msg: 'Failed to retrieve slots',
            error: error instanceof Error ? error.message : error
        });
    }
});
module.exports = router;
