const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), './cloud_storage/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './config/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

/**
 * Upload a file to Google Drive and get the link
 * @param {object} file - File object from the frontend
 * @param {string} folderId - Optional folder ID to specify the location on Drive
 * @returns {Promise<{fileId: string, fileLink: string}>} - Returns file ID and link
 */
async function uploadFile(buffer, authClient, originalname, mimetype, folderId = null) {
  const drive = google.drive({version: 'v3', auth: authClient});

  // File metadata with optional folder
  const fileMetadata = {
      name: originalname,
      parents: folderId ? [folderId] : [],  // Use folder ID if provided
  };

  // Convert buffer to a readable stream
  const media = {
      mimeType: mimetype,
      body: Readable.from(buffer),  // Convert the buffer to a stream
  };

  try {
      const response = await drive.files.create({
          resource: fileMetadata,
          media,
          fields: 'id, webViewLink',  // Include the file's web view link
      });

      const fileId = response.data.id;
      const fileLink = response.data.webViewLink;  // Shareable link to the file

      console.log(`File uploaded successfully. File ID: ${fileId}`);
      console.log(`File link: ${fileLink}`);
      return { fileId, fileLink };
  } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
  }
}
const folder_id = '10iR6YmOikDEkEVqsQK2hvfTGj4dKv4ce';
const {readFileSync} = require('fs');
const { Readable } = require('stream');
const buffer = readFileSync('./cloud_storage/temp.txt');

authorize()
  .then(data => uploadFile(buffer, data, 'temp.txt', 'text/plain', folder_id));
