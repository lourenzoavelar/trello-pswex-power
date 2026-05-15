var t = TrelloPowerUp.iframe();

function autoResizeTextarea(ta) {
  if (!ta || ta.tagName.toLowerCase() !== 'textarea') return;
  ta.style.resize = 'none';
  ta.style.overflow = 'hidden';
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

t.render(function() {
  Promise.all([
    t.get('board', 'shared', 'clientsList'),
    t.get('card', 'shared', 'customFieldsData'),
    t.get('card', 'shared', 'iaSynced'),
    t.card('desc')
  ]).then(function(values) {
    var clientsList   = values[0] || [];
    var data          = values[1];
    var iaSynced      = values[2];
    var cardDesc      = (values[3] && values[3].desc) || '';

    // Normalização caso o dado já tenha sido salvo com o wrapper (retrocompatibilidade)
    if (data && data.customFieldsData && !data.postCaption) {
      data = data.customFieldsData;
    }

    // -----------------------------------------------------------------------
    // Processamento automático de cards criados por IA
    // Roda aqui, dentro do render, para eliminar timing issues:
    //   1. detecta [IA_PROCESSAR] na descrição
    //   2. parseia o JSON
    //   3. salva customFieldsData + iaSynced num único t.set() (sem colisão)
    //   4. usa o JSON parseado direto para popular os campos (sem re-render)
    // -----------------------------------------------------------------------
    function processarCardIA() {
      if (iaSynced) return Promise.resolve(data);
      if (!cardDesc || !cardDesc.trimStart().startsWith('[IA_PROCESSAR]')) return Promise.resolve(data);

      console.log('[IA] Detectado card para processamento automático.');

      var jsonMatch = cardDesc.match(/IA_PLUGIN_DATA_START([\s\S]*?)IA_PLUGIN_DATA_END/);
      if (!jsonMatch) {
        console.warn('[IA] Marcadores IA_PLUGIN_DATA_START / IA_PLUGIN_DATA_END não encontrados.');
        return Promise.resolve(data);
      }

      var rawJson = jsonMatch[1].trim();
      var parsed;
      try {
        var rawParsed = JSON.parse(rawJson);
        // Suporte a wrapper "customFieldsData"
        parsed = rawParsed.customFieldsData || rawParsed;
      } catch (e) {
        console.error('[IA] JSON inválido — campos não serão alterados:', e.message);
        return Promise.resolve(data);
      }

      console.log('[IA] JSON parseado com sucesso:', parsed);

      // Salva customFieldsData + iaSynced numa única chamada (sem colisão)
      return t.set('card', 'shared', {
        customFieldsData: parsed,
        iaSynced: true
      }).then(function() {
        console.log('[IA] Dados salvos no pluginData.');
        return parsed; // usa o dado parseado direto, sem reler
      });
    }

    return processarCardIA().then(function(dadosFinais) {
      data = dadosFinais; // pode ser o original ou o recém-parseado
    
    // popular select clientProject
    var clientSelect = document.getElementById('clientProject');
    clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
    
    var clientExistsInList = false;
    clientsList.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      clientSelect.appendChild(opt);
      if (data && data.clientProject === c) {
        clientExistsInList = true;
      }
    });

    if (data) {
      // Se o cliente existe na data salva mas foi removido da config, injetamo-lo temporariamente para nao sumir do card
      if (data.clientProject && !clientExistsInList) {
        var opt = document.createElement('option');
        opt.value = data.clientProject;
        // Marca que (Arquivado) para o usuário saber porque não está mais na config global
        opt.textContent = data.clientProject + " (Membro/Removido)"; 
        clientSelect.appendChild(opt);
      }
      
      clientSelect.value = data.clientProject || '';
      document.getElementById('post-caption').value = data.postCaption || '';
      
      // Lidar com arrays ou strings no campo socialNetwork
      var savedNetworks = [];
      if (Array.isArray(data.socialNetwork)) {
        savedNetworks = data.socialNetwork;
      } else if (typeof data.socialNetwork === 'string' && data.socialNetwork !== '') {
        savedNetworks = [data.socialNetwork];
      }

      var checkboxes = document.querySelectorAll('.social-checkbox');
      checkboxes.forEach(function(cb) {
        cb.checked = savedNetworks.includes(cb.value);
      });

      document.getElementById('art-guidelines').value = data.artGuidelines || '';
      document.getElementById('art-text').value = data.artText || '';
      document.getElementById('final-creative-link').value = data.finalCreativeLink || '';
      document.getElementById('ready-media-link').value = data.readyMediaLink || '';
      document.getElementById('creative-format').value = data.creativeFormat || '';
      var postDateEl = document.getElementById('postDate');
      if (postDateEl) postDateEl.value = data.postDate || '';
      
      updateLinkStyle();

      // Novos campos aba Anuncio e IA
      document.getElementById('ad-main-text').value = data.adMainText || '';
      document.getElementById('ad-variations').value = data.adVariations || '';
      document.getElementById('ad-title-1').value = data.adTitle1 || '';
      document.getElementById('ad-title-2').value = data.adTitle2 || '';
      document.getElementById('ad-title-3').value = data.adTitle3 || '';
      document.getElementById('ad-title-4').value = data.adTitle4 || '';
      document.getElementById('ai-agent-link').value = data.aiAgentLink || '';
      document.getElementById('ai-prompt-suggest').value = data.aiPromptSuggest || '';
    }
  }).then(function() {
    // Resize after populating all data
    var textAreas = document.querySelectorAll('#trello-form textarea');
    textAreas.forEach(function(ta) {
      if (ta.offsetParent !== null) { // se visível
        autoResizeTextarea(ta);
      }
    });
    t.sizeTo('#content');
    document.getElementById('btn-save').disabled = true;
  });   // fim de processarCardIA().then chain
  });   // fim de Promise.all().then(function(values)
});     // fim de t.render

// Ativar o botão salvar apenas quando houver alteração
var formInputs = document.querySelectorAll('#trello-form input, #trello-form textarea, #trello-form select');
formInputs.forEach(function(input) {
  input.addEventListener('input', function() {
    document.getElementById('btn-save').disabled = false;
    if (input.id === 'final-creative-link' || input.id === 'ready-media-link') {
      updateLinkStyle();
    }
    if (input.tagName.toLowerCase() === 'textarea') {
      autoResizeTextarea(input);
      t.sizeTo('#content');
    }
  });
  input.addEventListener('change', function() {
    document.getElementById('btn-save').disabled = false;
    
    if (input.id === 'final-creative-link' || input.id === 'ready-media-link') {
      updateLinkStyle();
    }
    
    // Auto-save no change/blur
    saveCustomFields();
  });
});

function updateLinkStyle() {
  updateLinkAnchor('final-creative-link', 'final-creative-link-anchor', 'final-creative-link-text');
  updateLinkAnchor('ready-media-link', 'ready-media-link-anchor', 'ready-media-link-text');
}

function updateLinkAnchor(inputId, anchorId, textSpanId) {
  var input = document.getElementById(inputId);
  var anchor = document.getElementById(anchorId);
  var textSpan = document.getElementById(textSpanId);
  if (!input || !anchor || !textSpan) return;

  var val = input.value.trim();
  if (val !== '') {
    input.classList.add('bg-green-100', 'border-green-400');
    anchor.href = val;
    textSpan.textContent = val;
    anchor.classList.remove('hidden');
  } else {
    input.classList.remove('bg-green-100', 'border-green-400');
    anchor.classList.add('hidden');
    anchor.href = '#';
    textSpan.textContent = '';
  }
}

document.getElementById('btn-save').addEventListener('click', function() {
  saveCustomFields();
});

function saveCustomFields() {
  var selectedNetworks = [];
  var checkboxes = document.querySelectorAll('.social-checkbox');
  checkboxes.forEach(function(cb) {
    if (cb.checked) {
      selectedNetworks.push(cb.value);
    }
  });

  var safeGet = function(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  };

  var dataToSave = {
    postCaption: safeGet('post-caption'),
    socialNetwork: selectedNetworks,
    artGuidelines: safeGet('art-guidelines'),
    artText: safeGet('art-text'),
    finalCreativeLink: safeGet('final-creative-link'),
    readyMediaLink: safeGet('ready-media-link'),
    creativeFormat: safeGet('creative-format'),
    postDate: safeGet('postDate'),
    clientProject: safeGet('clientProject'),
    
    // Novos campos
    adMainText: safeGet('ad-main-text'),
    adVariations: safeGet('ad-variations'),
    adTitle1: safeGet('ad-title-1'),
    adTitle2: safeGet('ad-title-2'),
    adTitle3: safeGet('ad-title-3'),
    adTitle4: safeGet('ad-title-4'),
    aiAgentLink: safeGet('ai-agent-link'),
    aiPromptSuggest: safeGet('ai-prompt-suggest')
  };


  t.set('card', 'shared', 'customFieldsData', dataToSave).then(function() {
    document.getElementById('btn-save').disabled = true;
    var feedback = document.getElementById('feedback-save');
    feedback.style.display = 'block';
    // Opcional para manter tamanho atualizado caso mude o height do feedback
    t.sizeTo('#content');
    setTimeout(function() {
      feedback.style.display = 'none';
      t.sizeTo('#content');
    }, 3000);
  });
}

// Ação de copiar e focar na textarea dinâmica
var copyButtons = document.querySelectorAll('.btn-copy');
copyButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var targetId = btn.getAttribute('data-target');
    var textArea = document.getElementById(targetId);
    if (!textArea) return;
    
    var textToCopy = textArea.value;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(function() {
        showCopyFeedback(btn, textArea);
      }).catch(function(err) {
        fallbackCopyTextToClipboard(textToCopy, btn, textArea);
      });
    } else {
      fallbackCopyTextToClipboard(textToCopy, btn, textArea);
    }
  });
});

function fallbackCopyTextToClipboard(text, btn, originalTextArea) {
  var tempArea = document.createElement("textarea");
  tempArea.value = text;
  tempArea.style.top = "0";
  tempArea.style.left = "0";
  tempArea.style.position = "fixed";

  document.body.appendChild(tempArea);
  tempArea.focus();
  tempArea.select();

  try {
    var successful = document.execCommand('copy');
    if (successful) {
      showCopyFeedback(btn, originalTextArea);
    }
  } catch (err) {
    console.error('Fallback: Falha ao copiar texto', err);
  }

  document.body.removeChild(tempArea);
}

function showCopyFeedback(btn, textArea) {
  var tooltip = btn.querySelector('.tooltip-copy');
  if (tooltip) {
    tooltip.style.opacity = '1';
  }
  textArea.focus();
  
  setTimeout(function() {
    if (tooltip) {
      tooltip.style.opacity = '0';
    }
  }, 2000);
}

// Lógica das Abas (Tabs) 
const tabs = ['post', 'ad', 'ia', 'publish'];
tabs.forEach(function(tab) {
  document.getElementById('tab-' + tab).addEventListener('click', function() {
    // Esconde todos
    tabs.forEach(function(tId) {
      document.getElementById('content-' + tId).classList.add('hidden');
      document.getElementById('content-' + tId).classList.remove('block');
      document.getElementById('tab-' + tId).classList.remove('active', 'border-primary', 'text-primary');
      document.getElementById('tab-' + tId).classList.add('border-transparent', 'text-on-surface-variant');
    });
    // Mostra o clicado ativo
    document.getElementById('content-' + tab).classList.remove('hidden');
    document.getElementById('content-' + tab).classList.add('block');
    document.getElementById('tab-' + tab).classList.add('active', 'border-primary', 'text-primary');
    document.getElementById('tab-' + tab).classList.remove('border-transparent', 'text-on-surface-variant');
    
    // Resize textareas inside the newly visible tab
    var visibleTextAreas = document.querySelectorAll('#content-' + tab + ' textarea');
    visibleTextAreas.forEach(function(ta) {
      autoResizeTextarea(ta);
    });

    // Atualiza resize do iframe com timer leve por causa do 'hidden' display transition
    setTimeout(function() {
      t.sizeTo('#content');
    }, 100);
  });
});

// Ações dos botões de IA
var aiButtons = document.querySelectorAll('.btn-ai');
aiButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var targetId = this.getAttribute('data-target');
    var targetField = document.getElementById(targetId);
    var fieldValue = targetField ? targetField.value : '';
    
    var aiLinkInput = document.getElementById('ai-agent-link').value;
    if (!aiLinkInput) {
      alert("Por favor, cole o link do seu Agente de IA na aba 'IA' antes de usar os botões.");
      return;
    }

    var context = t.getContext();
    var boardId = context.board || '';
    var listId = context.list || '';
    var cardId = context.card || '';
    
    // Constrói o texto do prompt
    var customPrompt = document.getElementById('ai-prompt-suggest').value;
    var promptParts = [];
    
    if (customPrompt && customPrompt.trim() !== '') {
      promptParts.push(customPrompt.trim());
    }
    
    promptParts.push("Informações de Rastreio (IDs): " + boardId + " / " + listId + " / " + cardId);
    promptParts.push("Campo Alvo: " + targetId);
    
    if (fieldValue && fieldValue.trim() !== '') {
      promptParts.push("Conteúdo atual do campo:\n" + fieldValue);
    }
    
    var finalPrompt = promptParts.join('\n\n');
    
    var params = new URLSearchParams();
    params.append('hints', 'search');
    params.append('q', finalPrompt);
    
    var separator = aiLinkInput.includes('?') ? '&' : '?';
    var finalUrl = aiLinkInput + separator + params.toString();
    
    // Mostra feedback visual no botão de que foi copiado
    var originalHTML = this.innerHTML;
    this.innerHTML = '<span class="text-[10px] font-bold text-green-600 mx-1">Copiado!</span>';
    var btnRef = this;
    setTimeout(function() {
      btnRef.innerHTML = originalHTML;
    }, 2000);

    // Copia o prompt para a área de transferência antes de abrir a aba
    if (navigator.clipboard) {
      navigator.clipboard.writeText(finalPrompt).then(function() {
        window.open(finalUrl, '_blank');
      }).catch(function() {
        window.open(finalUrl, '_blank'); // fallback caso block
      });
    } else {
      window.open(finalUrl, '_blank');
    }
  });
});

// Ações dos botões de N8N
function triggerN8nWebhook(webhookType, btnId) {
  var btn = document.getElementById(btnId);
  if (!btn) return;

  var originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[18px]"></i> Enviando...';
  
  var feedbackContainer = document.getElementById('publish-feedback');
  var errorContainer = document.getElementById('publish-error');
  
  if (feedbackContainer) feedbackContainer.classList.add('hidden');
  if (errorContainer) errorContainer.classList.add('hidden');

  t.get('board', 'shared', webhookType).then(function(url) {
    if (!url) {
      if (errorContainer) {
        errorContainer.innerText = '⚠️ Configure os Endpoints (URL) nas Configurações do Power-Up.';
        errorContainer.classList.remove('hidden');
      }
      btn.disabled = false;
      btn.innerHTML = originalText;
      return t.sizeTo('#content');
    }

    var context = t.getContext();
    var payload = {
      cardId: context.card || '',
      boardId: context.board || '',
      action: webhookType === 'n8nPublishUrl' ? 'publish' : 'download'
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function(response) {
      if (response.ok) {
        if (feedbackContainer) feedbackContainer.classList.remove('hidden');
        
        // Processar retorno do webhook para baixar arquivos solicitados
        response.json().then(function(data) {
          if (Array.isArray(data)) {
            data.forEach(function(item) {
              if (item.job && Array.isArray(item.job.urls)) {
                item.job.urls.forEach(function(downloadUrl) {
                  var link = document.createElement('a');
                  link.href = downloadUrl;
                  link.setAttribute('download', '');
                  link.setAttribute('target', '_blank');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
              }
            });
          }
        }).catch(function(e) {
          console.log("Resposta n8n sem JSON de download.", e);
        });

      } else {
        response.text().then(function(errText) {
          if (errorContainer) {
            errorContainer.innerText = errText ? '⚠️ ' + errText : '⚠️ Erro ao enviar requisição (' + response.status + ')';
            errorContainer.classList.remove('hidden');
            t.sizeTo('#content');
          }
        }).catch(function() {
          if (errorContainer) {
            errorContainer.innerText = '⚠️ Erro ao enviar requisição (' + response.status + ')';
            errorContainer.classList.remove('hidden');
            t.sizeTo('#content');
          }
        });
      }
    }).catch(function(err) {
      console.error(err);
      if (errorContainer) {
        errorContainer.innerText = '⚠️ Falha de conexão com o servidor n8n';
        errorContainer.classList.remove('hidden');
      }
    }).finally(function() {
      btn.disabled = false;
      btn.innerHTML = originalText;
      t.sizeTo('#content');
    });
  });
}
document.getElementById('btn-n8n-publish').addEventListener('click', function() {
  saveCustomFields();
  
  var caption = document.getElementById('post-caption').value || '';
  var context = t.getContext();
  
  t.modal({
    url: './preview-modal.html',
    height: 600,
    args: { 
      caption: caption,
      cardId: context.card || '',
      boardId: context.board || ''
    }
  });
});

document.getElementById('btn-n8n-download').addEventListener('click', function() {
  triggerN8nWebhook('n8nDownloadUrl', 'btn-n8n-download');
});
