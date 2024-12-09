import dotenv from "dotenv"
dotenv.config();
import express from 'express';
import { Resend } from 'resend';
import createEvent from "./calender";
const { prisma } = require('../utils/client');
import { authmiddleware } from '../middlewares/auth';
const router = express.Router();


interface BookingRequestBody {
    speaker_id: number;
    date: string; // Expected format: "YYYY-MM-DD"
    time: string; // Expected format: "HH:MM"
}

router.post('/book-session', authmiddleware, async (req: any, res: any) => {
    try {
        const { speaker_id, date, time }: BookingRequestBody = req.body;
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


        const resend = new Resend(process.env.RESEND_API_KEY);

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
        })

        // Sending email to the speaker
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: speakerEmail?.user?.email, 
            subject: 'Booking update',
            html: `<p>${user_id} has booked slot ${availableSlot.slot_id}!</p>`
        });

        // Sending email to the user
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail?.email, 
            subject: 'Booking confirmation',
            html: `<p>Slot ${availableSlot.slot_id} successfully booked!</p>`
        });

        //creating event
        await createEvent({ startTime: startDateTime, endTime: endDateTime });

        res.status(201).json({
            msg: 'Session booked successfully!',
            booking,
        });

    } catch (error) {
        console.error('Error booking session:', error);
        res.status(500).json({
            msg: 'Booking failed',
            error: error instanceof Error ? error.message : error
        });
    }
});


interface CreateSlotsRequest {
    speaker_id: number;
    date: string; // "YYYY-MM-DD"
    start_times: string[]; // ["09:00", "10:00", "11:00", etc.]
}

router.post('/create-slots', authmiddleware, async (req: any, res: any) => {
    try {
        const { speaker_id, date, start_times }: CreateSlotsRequest = req.body;

        if (!speaker_id || !date || !start_times || start_times.length === 0) {
            return res.status(400).json({ msg: 'speaker_id, date, and start_times are required.' });
        }

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

        const createdSlots = await prisma.slots.createMany({
            data: slotsToCreate,
            skipDuplicates: true 
        });

        res.status(201).json({
            msg: 'Slots created successfully!',
            createdSlots
        });

    } catch (error) {
        console.error('Error creating slots:', error);
        res.status(500).json({
            msg: 'Slot creation failed',
            error: error instanceof Error ? error.message : error
        });
    }
});


router.get('/speaker-slots/:speaker_id', authmiddleware, async (req: any, res: any) => {
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
    } catch (error) {
        console.error('Error retrieving slots:', error);
        res.status(500).json({
            msg: 'Failed to retrieve slots',
            error: error instanceof Error ? error.message : error
        });
    }
});


module.exports = router;