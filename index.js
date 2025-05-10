require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = 3000;

// Your Shopify credentials
const SHOP_URL = "demo-storetesting.myshopify.com";
const ACCESS_TOKEN = "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";
const API_VERSION = '2023-10';

// Fetch all files using cursor-based pagination
async function fetchAllFilesGraphQL() {
  const endpoint = `https://${SHOP_URL}/admin/api/${API_VERSION}/graphql.json`;

  let allFiles = [];
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const query = `
      {
        files(first: 100${endCursor ? `, after: "${endCursor}"` : ''}) {
          edges {
            cursor
            node {
              ... on GenericFile {
                id
                alt
                url
                createdAt
              }
              ... on MediaImage {
                id
                alt
                image {
                  url
                }
                createdAt
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    try {
      const response = await axios.post(endpoint, { query }, {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json',
        }
      });

      const { edges, pageInfo } = response.data.data.files;
      allFiles.push(...edges);
      hasNextPage = pageInfo.hasNextPage;
      endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    } catch (error) {
      console.error('❌ Error during GraphQL fetch:', error.response?.data || error.message);
      break;
    }
  }

  return allFiles;
}

// Route: Homepage with download button
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Download Shopify Files CSV</title></head>
      <body>
        <h1>📥 Download Shopify Files</h1>
        <a href="/download" download><button>Download CSV</button></a>
      </body>
    </html>
  `);
});

// Route: Generates CSV and serves it for download
app.get('/download', async (req, res) => {
  const files = await fetchAllFilesGraphQL();

  const csvWriter = createCsvWriter({
    path: 'shopify_files.csv',
    header: [
      { id: 'id', title: 'ID' },
      { id: 'alt', title: 'ALT_TEXT' },
      { id: 'url', title: 'URL' },
      { id: 'createdAt', title: 'CREATED_AT' }
    ]
  });

  const records = files.map(({ node }) => ({
    id: node.id,
    alt: node.alt || 'N/A',
    url: node.url || (node.image && node.image.url) || 'N/A',
    createdAt: node.createdAt || 'N/A'
  }));

  await csvWriter.writeRecords(records);

  const filePath = path.join(__dirname, 'shopify_files.csv');
  res.download(filePath, 'shopify_files.csv');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
