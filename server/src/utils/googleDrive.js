const { google } = require('googleapis');
const stream = require('stream');

/**
 * Uploads a file buffer to Google Drive.
 * 
 * Requires the following environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_JSON (stringified JSON of the service account key)
 * - GOOGLE_DRIVE_FOLDER_ID (ID of the folder to upload to)
 * 
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {String} fileName - The name of the file
 * @param {String} mimeType - The mime type of the file
 * @returns {String} The public webViewLink of the uploaded file, or null if credentials are not set
 */
const uploadToGoogleDrive = async (fileBuffer, fileName, mimeType) => {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!credentialsJson || !folderId) {
    console.warn("Google Drive credentials not found in environment variables. Falling back to base64.");
    return null;
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (error) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", error);
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: mimeType,
    body: bufferStream,
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return the direct download link instead of webViewLink if possible, 
    // or webViewLink if webContentLink is null
    return response.data.webContentLink || response.data.webViewLink;
  } catch (error) {
    console.error("Failed to upload to Google Drive:", error);
    return null;
  }
};

module.exports = {
  uploadToGoogleDrive,
};
