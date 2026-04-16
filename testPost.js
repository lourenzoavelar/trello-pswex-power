require('dotenv').config();
const axios = require('axios');

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

const OUR_PLUGIN_ID = '69bc05f8d59322afac0c1c67';
const cardId = '69caabaac3891f80ad72fffe'; 

const api = axios.create({
    baseURL: 'https://api.trello.com/1',
    params: { key: TRELLO_API_KEY, token: TRELLO_TOKEN }
});

async function testPost() {
    try {
        console.log("Tentando POST...");
        await api.post(`/cards/${cardId}/pluginData`, null, {
            params: {
                idPlugin: OUR_PLUGIN_ID,
                access: 'shared',
                visibility: 'shared',
                value: '{"test":"1"}'
            }
        });
        console.log("POST DEU CERTO!");
    } catch(e) {
        console.error("ERRO POST:", e.response ? e.response.data : e.message);
    }
}

testPost();
