const fs = require('fs');
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), './credentials/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './credentials/credentials.json');

let client = null;
const folderId = '10iR6YmOikDEkEVqsQK2hvfTGj4dKv4ce';

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
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
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let load_client = await loadSavedCredentialsIfExist();
  
  if (load_client) {
    client = load_client;
    return;
  }

  load_client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (load_client.credentials) {
    await saveCredentials(load_client);
  }
  
  client = load_client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles() {
  const drive = google.drive({version: 'v3', client});
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
async function uploadFile(buffer, originalname, mimeType) {
  
  const drive = google.drive({version: 'v3', auth: client});
  
  // File metadata with optional folder
  const fileMetadata = {
      name: originalname,
      parents: folderId ? [folderId] : [],  // Use folder ID if provided
  };

  const { Readable } = require('stream');
  // Convert buffer to a readable stream
  const media = {
      mimeType: mimeType,
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

async function downloadFile(file_id) {

  const drive = google.drive({version: 'v3', auth: client});

  await drive.files.get(
    {fileId: file_id, alt: "media",},
    {responseType: "stream"},
    (err, { data }) => {
      if (err) {
        console.log("dsaodposadsjkaposa");
        console.log(err);
        return;
      }
      console.log("dsao");
      let buf = [];
      data.on("data", (e) => {
        buf.push(e)
        console.log("Pushed");
      });
      data.on("end", () => {
        const buffer = Buffer.concat(buf);
        return buffer;
      });
    }
  );

}

async function deleteFile(file_id){

  const drive = google.drive({version: 'v3', auth: client});

  const response = await drive.files.delete({
    fileId: file_id
  });

  console.log(response);
  return response;

}

async function test() {
  
  await authorize();

  // const t1 = performance.now();
  // const buffer = fs.readFileSync('./cloud_storage/temp.pdf');

  // await uploadFile(buffer, 'tempp.pdf', 'application/pdf');

  // const t2 = performance.now();
  // console.log(t2-t1);

  const buffer = await downloadFile('1wvIPBY0gADfkV4KztkhxOgPely7PqJVU');

  console.log(typeof buffer);

  fs.writeFile('something.pdf', buffer, (err) => {
    if (err) {
      console.error('Error writing the file:', err);
    } else {
      console.log('PDF file has been successfully written to disk!');
    }
  });

  // await deleteFile('1ye8EGD-hQM2Ie-JZtLMtOPBFV0mflfA-');

}



test();