require('dotenv').config();
const axios = require('axios');

const SHOP_URL = "demo-storetesting.myshopify.com"
const ACCESS_TOKEN = "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";
const API_VERSION = '2023-10';

async function fetchFiles() {
  const endpoint = `https://${SHOP_URL}/admin/api/${API_VERSION}/files.json`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      }
    });

    const files = response.data.files;
    if (files.length === 0) {
      console.log('No files found in the store.');
      return;
    }

    console.log('📂 Files in Shopify Store:\n');
    files.forEach(file => {
      console.log(`- ${file.filename} => ${file.url}`);
    });

  } catch (error) {
    console.error('❌ Error fetching files:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

fetchFiles();
