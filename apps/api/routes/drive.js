const express = require('express');
const router = express.Router();

/**
 * GET /api/drive/list?folder=DRIVE_FOLDER_URL_OR_ID
 *
 * STUB — Lists image files in a Google Drive folder.
 *
 * Full implementation:
 *   1. Extract folder ID from the provided URL or use as-is if already an ID.
 *   2. Authenticate with the Google Drive API using GOOGLE_SERVICE_ACCOUNT_JSON.
 *   3. Call drive.files.list with the folder as parent, filter mimeType image/*.
 *   4. Return array of { id, name, webContentLink, thumbnailLink }.
 *
 * To activate:
 *   - Set GOOGLE_SERVICE_ACCOUNT_JSON in root .env
 *   - Share the Drive folder with the service account's email address
 *   - npm install googleapis in apps/api
 */
router.get('/list', async (req, res) => {
  const { folder } = req.query;

  if (!folder) {
    return res.status(400).json({ success: false, error: 'folder query parameter is required' });
  }

  // Extract folder ID from full Drive URL if needed
  let folderId = folder;
  const match = folder.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) folderId = match[1];

  // STUB response
  res.json({
    success: true,
    data: {
      folder_id: folderId,
      files: [],
      stub: true,
      message:
        'Drive integration is stubbed. Set GOOGLE_SERVICE_ACCOUNT_JSON in root .env and share the Drive folder with the service account email to activate.',
    },
  });
});

module.exports = router;
