const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_BASE_URL = process.env.ZOOM_BASE_URL;

let cachedAccessToken = null;
let tokenExpiry = null;

const getZoomAccessToken = async () => {
    // ... (Your existing getZoomAccessToken function is correct) ...
    try {
        if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
            return cachedAccessToken;
        }

        const tokenResponse = await axios.post(
            `https://zoom.us/oauth/token`,
            qs.stringify({ grant_type: 'account_credentials', account_id: ZOOM_ACCOUNT_ID }),
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        cachedAccessToken = tokenResponse.data.access_token;
        tokenExpiry = Date.now() + tokenResponse.data.expires_in * 1000;

        return cachedAccessToken;
    } catch (error) {
        console.error("Error fetching Zoom access token:", error.response?.data || error.message);
        return null;
    }
};

const createZoomMeeting = async (doctorName, appointmentDate, appointmentTime) => {
    try {
        const accessToken = await getZoomAccessToken();
        if (!accessToken) {
            throw new Error("Failed to get Zoom access token");
        }

        // Construct the start_time in ISO 8601 format with timezone
        const startTime = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

        const meetingResponse = await axios.post(
            `${ZOOM_BASE_URL}/users/me/meetings`,
            {
                topic: `Consultation with Dr. ${doctorName}`,
                type: 2, // Scheduled meeting
                start_time: startTime,
                duration: 30,
                timezone: "Asia/Kuala_Lumpur",
                agenda: "Patient Consultation",
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return meetingResponse.data;
    } catch (error) {
        console.error("Error creating Zoom meeting:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { createZoomMeeting };