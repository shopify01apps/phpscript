require('dotenv').config();
const axios = require('axios');

const SHOP_URL = "demo-storetesting.myshopify.com";
const ACCESS_TOKEN = "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";
const API_VERSION = '2023-10';

async function fetchFilesGraphQL() {
  const endpoint = `https://${SHOP_URL}/admin/api/${API_VERSION}/graphql.json`;

  const query = `
    {
      files(first: 20) {
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

    const files = response.data.data.files.edges;
    if (files.length === 0) {
      console.log('No files found in the store.');
      return;
    }

    console.log('📂 Files in Shopify Store (GraphQL):\n');
    files.forEach(({ node }) => {
      if (node.url) {
        console.log(`- File URL => ${node.url}`);
      } else if (node.image && node.image.url) {
        console.log(`- Image URL => ${node.image.url}`);
      }
    });

  } catch (error) {
    console.error('❌ Error fetching files via GraphQL:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

fetchFilesGraphQL();
