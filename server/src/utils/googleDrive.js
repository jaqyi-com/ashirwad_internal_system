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
 * @param {String} subfolderName - Optional subfolder name to create/use inside the root folder
 * @returns {String} The public webViewLink of the uploaded file, or null if credentials are not set
 */
const uploadToGoogleDrive = async (fileBuffer, fileName, mimeType, subfolderName = null) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientId || !clientSecret || !refreshToken || !folderId) {
    console.warn("Google Drive OAuth2 credentials not found in environment variables. Falling back to base64.");
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground' // Default redirect URI used for token generation
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  let targetFolderId = folderId;
  
  if (subfolderName) {
    try {
      const query = `name='${subfolderName.replace(/'/g, "\\'")}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const resList = await drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id)',
      });

      if (resList.data.files && resList.data.files.length > 0) {
        targetFolderId = resList.data.files[0].id;
      } else {
        const createRes = await drive.files.create({
          resource: {
            name: subfolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [folderId],
          },
          fields: 'id',
        });
        targetFolderId = createRes.data.id;
      }
    } catch (err) {
      console.error("Failed to get/create subfolder, using root folder:", err);
    }
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const fileMetadata = {
    name: fileName,
    parents: [targetFolderId],
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

    // webContentLink often forces a download (Content-Disposition: attachment), causing blank images in <img> tags.
    // The most reliable way to hotlink Google Drive images inline is using the thumbnail endpoint.
    return `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w1200`;
  } catch (error) {
    console.error("Failed to upload to Google Drive:", error);
    return null;
  }
};

module.exports = {
  uploadToGoogleDrive,
};
