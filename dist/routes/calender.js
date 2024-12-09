"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//Final index.js code
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, null, GOOGLE_PRIVATE_KEY, SCOPES);
const calendar = google.calendar({
    version: 'v3',
    project: GOOGLE_PROJECT_NUMBER,
    auth: jwtClient
});
async function createEvent({ startTime, endTime }) {
    const event = {
        summary: 'Booking Confirmed!',
        location: 'Google Meet',
        description: 'speaking session',
        start: {
            dateTime: startTime, // Example: '2022-01-12T09:00:00-07:00'
            timeZone: 'Asia/Dhaka',
        },
        end: {
            dateTime: endTime, // Example: '2022-01-14T17:00:00-07:00'
            timeZone: 'Asia/Dhaka',
        },
        attendees: [],
        reminders: {
            useDefault: true,
        },
    };
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: '/Users/root1/Downloads/booking-calender-444116-920f71e6c697.json',
            scopes: 'https://www.googleapis.com/auth/calendar',
        });
        const authClient = await auth.getClient();
        // Insert the event into the calendar
        const response = await calendar.events.insert({
            auth: authClient,
            calendarId: GOOGLE_CALENDAR_ID, // Replace with your calendar ID if different
            resource: event,
        });
        console.log('Event created successfully:', response.data);
        return 'Event successfully created!';
    }
    catch (error) {
        console.error('Error creating event:', error);
        throw new Error('Failed to create event');
    }
}
exports.default = createEvent;
