require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const NEW_SHOP_URL = '47k2tr-hj.myshopify.com';
const NEW_ACCESS_TOKEN = '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'; // Access token for the new store
const API_VERSION = '2023-10';
const CSV_PATH = './shopify_files (1).csv';

const uploadFileToShopify = async (base64Data, filename, alt) => {
  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          alt
          createdAt
          fileStatus
          preview {
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    files: [
      {
        originalSource: `data:image/jpeg;base64,${base64Data}`,
        alt: alt || filename,
        contentType: 'IMAGE'
      }
    ]
  };

  const endpoint = `https://${NEW_SHOP_URL}/admin/api/${API_VERSION}/graphql.json`;

  try {
    const response = await axios.post(
      endpoint,
      { query: mutation, variables },
      {
        headers: {
          'X-Shopify-Access-Token': NEW_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        }
      }
    );

    const result = response.data.data.fileCreate;
    if (result.userErrors.length) {
      console.error('❌ Upload Error:', result.userErrors);
    } else {
      console.log(`✅ Uploaded: ${filename}`);
    }

  } catch (error) {
    console.error('❌ Upload Request Failed:', error.message);
  }
};

const downloadAndUpload = async (url, alt) => {
  const filename = path.basename(url);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64Data = buffer.toString('base64');

    await uploadFileToShopify(base64Data, filename, alt);

  } catch (err) {
    console.error(`❌ Failed to download or upload ${filename}: ${err.message}`);
  }
};

const startUpload = () => {
  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', async (row) => {
      const url = row.URL;
      const alt = row.ALT_TEXT;

      if (url && url.startsWith('http')) {
        await downloadAndUpload(url, alt);
      }
    })
    .on('end', () => {
      console.log('🎉 Upload process completed.');
    });
};

startUpload();
