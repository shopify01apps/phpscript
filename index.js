require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const SHOP_URL = "demo-storetesting.myshopify.com";
const ACCESS_TOKEN = "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";
const API_VERSION = '2023-10';

async function fetchFilesGraphQL() {
  const endpoint = `https://${SHOP_URL}/admin/api/${API_VERSION}/graphql.json`;

  const query = `
    {
      files(first: 50) {
        edges {
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

    return response.data.data.files.edges;
  } catch (error) {
    console.error('❌ Error fetching files via GraphQL:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    return [];
  }
}

async function exportToCSV() {
  const files = await fetchFilesGraphQL();

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
  console.log('✅ shopify_files.csv created successfully!');
}

exportToCSV();
