/* global TrelloPowerUp */

const ENABLE_MIGRATION_TOOL = false;

// Chave pública do Power-Up — obtenha em: https://trello.com/power-ups/admin
// Troque pela sua appKey real (é pública, pode ficar no código)
const TRELLO_APP_KEY = 'SUA_APP_KEY_AQUI';

// ---------------------------------------------------------------------------
// Processamento automático de cards criados por IA
// ---------------------------------------------------------------------------

/**
 * Lock em memória para evitar race condition entre os hooks que chamam
 * processIaCard() simultaneamente (card-badges + card-back-section).
 * O lock é por card — usa o ID do card como chave.
 */
const _iaProcessingLocks = {};

/**
 * Processa automaticamente cards criados por IA.
 *
 * Fluxo:
 *   1. Adquire lock (evita execução dupla simultânea)
 *   2. Lê descrição e verifica [IA_PROCESSAR] (early return, evita async desnecessário)
 *   3. Verifica iaSynced (idempotência)
 *   4. Extrai e faz parse do JSON (fail-safe: aborta sem limpar em caso de erro)
 *   5. Salva customFieldsData no pluginData
 *   6. Marca iaSynced = true
 *   7. Limpa a descrição (SEMPRE APÓS salvar — nunca antes)
 *
 * Garante:
 *   - Cards humanos são completamente ignorados
 *   - Nunca reprocessa (iaSynced)
 *   - Nunca perde dados em caso de JSON inválido
 *   - Sem execução duplicada (lock por card)
 *
 * @param {object} t - Contexto do Power-Up (Trello)
 * @returns {Promise<void>}
 */
async function processIaCard(t) {
  // --- PASSO 1: Adquirir lock em memória (anti race condition) ---
  const cardInfo = await t.card('id', 'desc');
  const cardId = cardInfo.id;
  const desc = cardInfo.desc || '';

  if (_iaProcessingLocks[cardId]) {
    console.log('[IA] Processamento já em andamento para este card. Pulando.');
    return;
  }
  _iaProcessingLocks[cardId] = true;

  try {
    // --- PASSO 2: Checar prefixo [IA_PROCESSAR] ANTES de qualquer outro await ---
    // (performance: evita chamadas desnecessárias ao pluginData)
    if (!desc || !desc.trimStart().startsWith('[IA_PROCESSAR]')) {
      return; // Card humano — não processar
    }

    // --- PASSO 3: Checar iaSynced ANTES de qualquer processamento pesado ---
    const iaSynced = await t.get('card', 'shared', 'iaSynced');
    if (iaSynced) {
      console.log('[IA] Card já sincronizado (iaSynced=true). Pulando.');
      return;
    }

    console.log('[IA] Iniciando processamento automático do card:', cardId);

    // --- PASSO 4: Extrair e parsear o JSON (fail-safe) ---
    const jsonMatch = desc.match(/IA_PLUGIN_DATA_START([\s\S]*?)IA_PLUGIN_DATA_END/);
    if (!jsonMatch) {
      console.warn('[IA] Marcadores IA_PLUGIN_DATA_START / IA_PLUGIN_DATA_END não encontrados. Abortando sem alterar o card.');
      return;
    }

    const rawJson = jsonMatch[1].trim();

    let customFieldsData;
    try {
      customFieldsData = JSON.parse(rawJson);
    } catch (parseErr) {
      // FAIL-SAFE: JSON inválido → loga e aborta SEM limpar a descrição
      // (preserva os dados originais para nova tentativa manual)
      console.error('[IA] JSON inválido — descrição NÃO será alterada:', parseErr.message);
      console.error('[IA] Conteúdo recebido:', rawJson);
      return;
    }

    console.log('[IA] JSON parseado com sucesso:', customFieldsData);

    // --- PASSO 5: Salvar dados no pluginData ---
    await t.set('card', 'shared', 'customFieldsData', customFieldsData);
    console.log('[IA] customFieldsData salvo.');

    // --- PASSO 6: Marcar como processado (antes de limpar a descrição) ---
    await t.set('card', 'shared', 'iaSynced', true);
    console.log('[IA] iaSynced marcado como true.');

    // --- PASSO 7: Limpar descrição (SEMPRE APÓS salvar — nunca antes) ---
    const cleanDesc = desc
      .replace(/\[IA_PROCESSAR\]/g, '')
      .replace(/IA_PLUGIN_DATA_START[\s\S]*?IA_PLUGIN_DATA_END/g, '')
      .trim();

    const finalDesc = cleanDesc.length > 0
      ? cleanDesc
      : 'Card criado automaticamente pela IA.';

    try {
      const restApi = t.getRestApi();
      const token = await restApi.getToken();

      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?key=${TRELLO_APP_KEY}&token=${token}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ desc: finalDesc })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('[IA] Falha ao atualizar descrição:', response.status, errText);
      } else {
        console.log('[IA] Descrição limpa com sucesso. Texto final:', finalDesc);
      }
    } catch (apiErr) {
      // A limpeza da descrição falhou, mas os dados JÁ foram salvos
      // iaSynced=true evita reprocessamento; a descrição suja é inofensiva
      console.error('[IA] Erro ao limpar descrição via API (dados já salvos):', apiErr.message);
    }

  } catch (err) {
    console.error('[IA] Erro inesperado durante processamento do card:', err);
  } finally {
    // Liberar lock independentemente do resultado
    delete _iaProcessingLocks[cardId];
  }
}

// ---------------------------------------------------------------------------
// Inicialização do Power-Up
// ---------------------------------------------------------------------------

TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    var buttons = [{
      icon: {
        dark: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
        light: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png'
      },
      text: 'Gráfico Gantt',
      callback: function(t) {
        return t.modal({
          title: 'Gráfico Gantt',
          url: 'https://lourenzoavelar.github.io/trello-gantt-powerup/gantt.html',
          height: 720,
          fullscreen: true
        });
      }
    }];

    if (ENABLE_MIGRATION_TOOL) {
      buttons.push({
        icon: 'https://app.amazingpowerups.com/assets/section_icon_list-alt.svg',
        text: 'Migrar Amazing Fields',
        callback: function (t) {
          return t.modal({
            title: 'Ferramenta de Migração',
            url: './migrate.html',
            height: 500
          });
        }
      });
    }
    return buttons;
  },

  'card-buttons': function(t, options) {
    return [];
  },

  'card-detail-badges': function(t, options) {
    return [];
  },

  'show-settings': function(t, options) {
    return t.modal({
      title: 'Configurações de Clientes/Projetos',
      url: t.signUrl('./settings.html'),
      height: 350
    });
  },

  'card-badges': function(t, options) {
    // Dispara processamento IA de forma assíncrona (não bloqueia badges)
    processIaCard(t).catch(function(err) {
      console.error('[IA] Erro em card-badges:', err);
    });

    return t.get('card', 'shared', 'customFieldsData')
      .then(function(data) {
        var badges = [];
        if (data) {
          if (data.clientProject) {
            badges.push({ text: data.clientProject, color: 'blue' });
          }
          if (data.creativeFormat) {
            badges.push({ text: data.creativeFormat, color: 'green' });
          }
        }
        return badges;
      });
  },

  'card-back-section': function(t, options) {
    // Dispara processamento IA ao abrir o card (não bloqueia a seção)
    processIaCard(t).catch(function(err) {
      console.error('[IA] Erro em card-back-section:', err);
    });

    return {
      title: 'Informações',
      icon: 'https://lourenzoavelar.github.io/trello-gantt-powerup/icon.png',
      content: {
        type: 'iframe',
        url: t.signUrl('./card-custom-fields.html'),
        height: 480
      }
    };
  },
}, {
  appKey: TRELLO_APP_KEY,
  appName: 'Gráfico Gantt Power-Up'
});
