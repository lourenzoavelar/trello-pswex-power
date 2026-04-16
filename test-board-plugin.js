require('dotenv').config();
const axios = require('axios');
const lzString = require('lz-string');

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.BOARD_ID;
const AMAZING_FIELDS_PLUGIN_ID = '60e068efb294647187bbe4f5';

const api = axios.create({ baseURL: 'https://api.trello.com/1', params: { key: TRELLO_API_KEY, token: TRELLO_TOKEN } });

async function checkBoard() {
    try {
        const { data: bData } = await api.get(`/boards/${BOARD_ID}/pluginData`);
        const pData = bData.find(p => p.idPlugin === AMAZING_FIELDS_PLUGIN_ID);
        if (pData) {
            let parsed = JSON.parse(pData.value);
            if (parsed.FD) {
                 const str = lzString.decompressFromUTF16(parsed.FD);
                 if (str) {
                      console.log(JSON.stringify(JSON.parse(str), null, 2));
                 }
            }
        }
    } catch(e) { console.error(e.message); }
}
checkBoard();
