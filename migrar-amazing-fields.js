require('dotenv').config();
const axios = require('axios');
const lzString = require('lz-string');

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.BOARD_ID;

const AMAZING_FIELDS_PLUGIN_ID = '60e068efb294647187bbe4f5';
const OUR_PLUGIN_ID = '69bc05f8d59322afac0c1c67';

if (!TRELLO_API_KEY || !TRELLO_TOKEN || !BOARD_ID) {
    console.error('❌ Por favor, configure as variáveis TRELLO_API_KEY, TRELLO_TOKEN e BOARD_ID no arquivo .env');
    process.exit(1);
}

const api = axios.create({
    baseURL: 'https://api.trello.com/1',
    params: {
        key: TRELLO_API_KEY,
        token: TRELLO_TOKEN
    }
});

// Pelas amostragem, descobrimos exatamente qual ID é qual Campo!
const MAP_AMAZING_IDS_TO_OUR_FIELDS = {
    '4051eac1-c947-415d-9410-b4c94b26301d': 'postCaption',       // Legenda para o Carrossel
    'f19d2492-9e56-40a5-9043-f0262d3dbd89': 'artGuidelines',     // Orientações da arte
    '4e2e1c6d-1a23-44b0-b54f-6bb9b1c857de': 'artText',           // Texto inserir na arte
    'e82b9769-7cf8-46f9-ac6e-92e20692c118': 'finalCreativeLink', // Link do criativo (Canva link mostly)
    'ba41357c-6e28-4981-8a80-0ee9d493646b': 'creativeFormat',    // Formatos e orientacoes misturadas
    // Caso algum dos outros links seja o Mídia Pronta:
    '4bed0b79-9d30-4110-9214-482fb2bdfeee': 'readyMediaLink'     
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigrator() {
    console.log(`🚀 Iniciando Mapeamento e Migração Definitiva no quadro: ${BOARD_ID}`);
    
    try {
        const { data: cards } = await api.get(`/boards/${BOARD_ID}/cards`, {
            params: { pluginData: true }
        });
        
        console.log(`📦 Foram encontrados ${cards.length} cards no quadro.`);
        let migratedCount = 0;

        for (const card of cards) {
            const pluginDataList = card.pluginData || [];
            const amazingDataRaw = pluginDataList.find(p => p.idPlugin === AMAZING_FIELDS_PLUGIN_ID);
            
            if (amazingDataRaw && amazingDataRaw.value) {
                try {
                    let parsedData = JSON.parse(amazingDataRaw.value);
                    if (parsedData.FD) {
                        const decompressString = lzString.decompressFromUTF16(parsedData.FD);
                        if (!decompressString) continue;

                        const fieldsObj = JSON.parse(decompressString);
                        
                        let customFieldsData = {};
                        
                        for (const [amazingId, value] of Object.entries(fieldsObj)) {
                            // Ignora metadatas e strings vazias/inexistentes
                            if (amazingId.startsWith('__')) continue;
                            if (value === null || value === undefined || value === "") continue;

                            const nossoCampo = MAP_AMAZING_IDS_TO_OUR_FIELDS[amazingId];
                            if (nossoCampo) {
                                 customFieldsData[nossoCampo] = value;
                            }
                        }

                        // Se encontrou dados válidos para migrar
                        if (Object.keys(customFieldsData).length > 0) {
                            
                            const stringifiedNewData = JSON.stringify({ customFieldsData });

                            const alreadyHasOurData = pluginDataList.find(p => p.idPlugin === OUR_PLUGIN_ID);

                            if (alreadyHasOurData) {
                                // Atualiza um existente (PUT)
                                await api.put(`/cards/${card.id}/pluginData/${alreadyHasOurData.id}`, null, {
                                    params: { value: stringifiedNewData }
                                });
                            } else {
                                // Cria do zero (POST)
                                await api.post(`/cards/${card.id}/pluginData`, null, {
                                    params: { 
                                        idPlugin: OUR_PLUGIN_ID, 
                                        visibility: 'shared', 
                                        value: stringifiedNewData 
                                    }
                                });
                            }

                            migratedCount++;
                            console.log(`✅ [Migrado] Card: "${card.name}" `);
                            
                            // Rate limit suave (evitar block da api do Trello)
                            await sleep(200); 
                        }
                    }
                } catch(e) {
                   console.log(`❌ Erro parse no card ${card.id}:`, e.message);
                }
            }
        }

        console.log(`\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
        console.log(`Total de cards migrados: ${migratedCount}`);
        console.log(`Agora você já pode abrir o Trello e ver tudo renderizando no botão do Power-Up novo!`);

    } catch (error) {
        console.error('Erro na requisição à API do Trello:', error.response ? error.response.data : error.message);
    }
}

runMigrator();
