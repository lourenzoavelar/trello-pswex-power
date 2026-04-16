require('dotenv').config();
const axios = require('axios');
const lzString = require('lz-string');

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.BOARD_ID;
const AMAZING_FIELDS_PLUGIN_ID = '60e068efb294647187bbe4f5';

const api = axios.create({ baseURL: 'https://api.trello.com/1', params: { key: TRELLO_API_KEY, token: TRELLO_TOKEN } });

async function guessMapping() {
    try {
        const { data: cards } = await api.get(`/boards/${BOARD_ID}/cards`, { params: { pluginData: true } });
        const fieldValues = {};

        for (const card of cards) {
            const af = card.pluginData?.find(p => p.idPlugin === AMAZING_FIELDS_PLUGIN_ID);
            if (af) {
                try {
                    const parsed = JSON.parse(af.value);
                    if (parsed.FD) {
                        const str = lzString.decompressFromUTF16(parsed.FD);
                        if (str) {
                            const data = JSON.parse(str);
                            for (const [k, v] of Object.entries(data)) {
                                if (k !== '__version' && k !== '__boardId' && k !== '__lastEditSrvMs' && v) {
                                    if (!fieldValues[k]) fieldValues[k] = new Set();
                                    if (typeof v === 'string' && v.trim() !== '') {
                                         fieldValues[k].add(v.substring(0, 50));
                                    } else if (Array.isArray(v) && v.length) {
                                         fieldValues[k].add(JSON.stringify(v));
                                    }
                                }
                            }
                        }
                    }
                } catch(e) {}
            }
        }
        
        console.log("🧩 AMOSTRAS PARA MAPEAMENTO:");
        for (const k in fieldValues) {
            const arr = Array.from(fieldValues[k]);
            if (arr.length > 0) {
                console.log(`\nID: '${k}'`);
                console.log(`Exemplos: ${arr.slice(0, 3).join(' | ')}`);
            }
        }

    } catch(e) { console.error(e.message); }
}
guessMapping();
