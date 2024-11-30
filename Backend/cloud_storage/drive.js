const fs = require('fs');
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google, drive_v3} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), './credentials/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './credentials/credentials.json');

let drive = null;
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
  let client = await loadSavedCredentialsIfExist();
  
  if (client) {
    drive = google.drive({version: 'v3', auth: client});
  }

  if(!client){
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    
    drive = google.drive({version: 'v3', auth: client});
  }

  console.log("Connected to Google Drive...");
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles() {

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

      return { fileId, fileLink };
  } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
  }
}

async function downloadFile(file_id) {

  const buffer = await drive.files.get(
    {
      fileId: file_id, 
      alt: "media"
    },
    {
      responseType: "arraybuffer"
    }
  );

  return Buffer.from(buffer.data);

}

async function convertToGoogleDoc(fileId) {
  try {
    const response = await drive.files.copy({
      fileId,
      requestBody: {
        mimeType: 'application/vnd.google-apps.document', // Convert to Google Doc
      },
    });
    console.log('File converted to Google Doc:', response.data.id);
    return response.data.id; // Return the new Google Doc file ID
  } catch (error) {
    console.error('Error converting file to Google Doc:', error.message);
    throw error;
  }
}

// Function to export a Google Doc as a PDF
async function downloadAsPDF(fileId) {
  try {
    const response = await drive.files.export(
      {
        fileId,
        mimeType: 'application/pdf',
      },
      { responseType: 'arraybuffer' } // Fetch as arraybuffer for Buffer conversion
    );

    const fileBuffer = Buffer.from(response.data);
    console.log('PDF file buffer created');
    return fileBuffer; // Return the Buffer
  } catch (error) {
    console.error('Error exporting file as PDF:', error.message);
    throw error;
  }
}
async function downloadFileAsPDF(file_id) {
  
  const googleDocId = await convertToGoogleDoc(file_id); // Convert to Google Doc
  const buffer = await downloadAsPDF(googleDocId); // Export the Google Doc to PDF
  
  return {
    fileBuffer: buffer, 
    google_doc_id: googleDocId
  };

}

async function deleteFile(file_id){

  const response = await drive.files.delete({
    fileId: file_id
  });

  return response;

}


module.exports = {
    uploadFile,
    downloadFile,
    downloadFileAsPDF,
    deleteFile,
    authorize
}