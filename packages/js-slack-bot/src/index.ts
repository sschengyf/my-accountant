import { App } from '@slack/bolt';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

dotenv.config();

// Initialize Slack Bot
const app = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  signingSecret: process.env.SLACK_SIGNING_SECRET as string,
});

// Listen for file uploads
app.event('file_shared', async ({ event, client }) => {
  try {
    // Fetch file details
    const fileInfo = await client.files.info({ file: event.file_id });
    const fileUrl = fileInfo.file?.url_private_download || '';
    const fileName = fileInfo.file?.name || '';

    // Get bot user ID
    const authResponse = await app.client.auth.test();
    const botUserId = authResponse.user_id;

    // Check if the file was uploaded by the bot
    const uploaderId = fileInfo.file?.user || fileInfo.file?.bot_id;
    if (uploaderId === botUserId) {
      return;
    }

    // Download file from Slack
    const headers = { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` };
    const response = await axios.get(fileUrl, {
      headers,
      responseType: 'stream',
    });

    const filePath = path.join(__dirname, '../files', fileName);
    const folderPath = path.dirname(filePath);

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true }); // Create folder if missing
    }

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', async () => {
      // Upload file to API
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const apiResponse = await axios.post(
        process.env.CATEGORIZER_API_URL as string,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const csvContent = apiResponse.data;

      // Notify Slack user
      await client.chat.postMessage({
        channel: event.channel_id,
        text: `Your file **${fileName}** has been uploaded and is being processed!`,
      });

      await app.client.files.uploadV2({
        channel_id: event.channel_id,
        content: csvContent,
        filename: 'data.csv',
        title: 'Generated CSV File',
      });

      fs.unlinkSync(filePath); // Clean up file
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
  }
});

// Listen for direct messages to the bot
app.event('message', async ({ event, client }) => {
  try {
    // Ignore messages from bots (including itself)
    if (event.subtype === 'bot_message') return;

    if (!('text' in event)) return;
    if (!event.text) return;

    // Echo back the message
    await client.chat.postMessage({
      channel: event.channel,
      text: `You said: ${event.text}`,
    });
  } catch (error) {
    console.error('Error responding:', error);
  }
});

// Start Slack bot
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack bot is running!');
})();
