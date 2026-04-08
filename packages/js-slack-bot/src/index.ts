import { App, ExpressReceiver } from '@slack/bolt';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { GoogleAuth } from 'google-auth-library';

dotenv.config();

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET as string });

const auth = new GoogleAuth();

receiver.router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Initialize Slack Bot
const app = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  signingSecret: process.env.SLACK_SIGNING_SECRET as string,
  receiver,
});

async function callCategorizer(filePath: string, fileName: string, account: string, bank: string, channelId: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const categorizerApiUrl = process.env.CATEGORIZER_API_URL as string;
  const deploymentEnvironment = process.env.DEPLOYMENT_ENV || 'local';

  const headers = await (async () => {
    const baseHeaders = { 'Content-Type': 'multipart/form-data' };

    if (deploymentEnvironment === 'gcp') {
      const authClient = await auth.getIdTokenClient(categorizerApiUrl);
      const token = await authClient.idTokenProvider.fetchIdToken(categorizerApiUrl);
      return { ...baseHeaders, Authorization: `Bearer ${token}` };
    }

    return baseHeaders;
  })();

  const apiResponse = await axios.post(
    `${categorizerApiUrl}?bank=${encodeURIComponent(bank)}&account=${encodeURIComponent(account)}`,
    formData,
    { headers },
  );

  const csvContent = apiResponse.data;

  await app.client.files.uploadV2({
    channel_id: channelId,
    content: csvContent,
    filename: 'data.csv',
    title: 'Generated CSV File',
  });

  fs.unlinkSync(filePath);
}

// Handle /categorize slash command - opens modal
app.command('/cat-stmt', async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'categorize_modal',
      private_metadata: body.channel_id,
      title: { type: 'plain_text', text: 'Categorize Statement' },
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        {
          type: 'input',
          block_id: 'bank_block',
          label: { type: 'plain_text', text: 'Bank' },
          element: {
            type: 'static_select',
            action_id: 'bank_input',
            placeholder: { type: 'plain_text', text: 'Select a bank' },
            options: [
              { text: { type: 'plain_text', text: 'ASB' }, value: 'asb' },
              { text: { type: 'plain_text', text: 'ANZ' }, value: 'anz' },
            ],
          },
        },
        {
          type: 'input',
          block_id: 'account_block',
          label: { type: 'plain_text', text: 'Account Name' },
          element: {
            type: 'plain_text_input',
            action_id: 'account_input',
            placeholder: { type: 'plain_text', text: 'e.g. ASB Functor Limited' },
          },
        },
        {
          type: 'input',
          block_id: 'file_block',
          label: { type: 'plain_text', text: 'Bank Statement' },
          element: {
            type: 'file_input',
            action_id: 'file_input',
            filetypes: ['csv', 'xlsx', 'xls'],
          },
        },
      ],
    },
  });
});

// Handle modal submission
app.view('categorize_modal', async ({ ack, view, client }) => {
  await ack();

  const bank = view.state.values.bank_block.bank_input.selected_option?.value || 'asb';
  const account = view.state.values.account_block.account_input.value || '';
  const files = view.state.values.file_block.file_input.files || [];
  const channelId = view.private_metadata;

  await client.chat.postMessage({
    channel: channelId,
    text: 'Processing your bank statement, please wait...',
  });

  if (files.length === 0) return;

  const fileId = files[0].id;
  const fileInfo = await client.files.info({ file: fileId });
  const fileUrl = fileInfo.file?.url_private_download || '';
  const fileName = fileInfo.file?.name || 'statement';

  const downloadResponse = await axios.get(fileUrl, {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    responseType: 'stream',
  });

  const filePath = path.join(__dirname, '../files', fileName);
  const folderPath = path.dirname(filePath);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const writer = fs.createWriteStream(filePath);
  downloadResponse.data.pipe(writer);

  writer.on('finish', async () => {
    try {
      await callCategorizer(filePath, fileName, account, bank, channelId);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  });
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
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log('⚡️ Slack bot is running on port: ', port);
})();
