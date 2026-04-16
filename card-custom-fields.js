var t = TrelloPowerUp.iframe();

t.render(function() {
  Promise.all([
    t.get('board', 'shared', 'clientsList'),
    t.get('card', 'shared', 'customFieldsData')
  ]).then(function(values) {
    var clientsList = values[0] || [];
    var data = values[1];
    
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
      document.getElementById('postDate').value = data.postDate || '';
      document.getElementById('scheduledDate').value = data.scheduledDate || '';
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
    t.sizeTo('#content');
    document.getElementById('btn-save').disabled = true;
  });
});

// Ativar o botão salvar apenas quando houver alteração
var formInputs = document.querySelectorAll('#trello-form input, #trello-form textarea, #trello-form select');
formInputs.forEach(function(input) {
  input.addEventListener('input', function() {
    document.getElementById('btn-save').disabled = false;
  });
  input.addEventListener('change', function() {
    document.getElementById('btn-save').disabled = false;
    
    if (input.id === 'final-creative-link') {
      updateLinkStyle();
    }
    
    // Auto-save no change/blur
    saveCustomFields();
  });
});

function updateLinkStyle() {
  var creativeLink = document.getElementById('final-creative-link');
  if (creativeLink && creativeLink.value.trim() !== '') {
    creativeLink.classList.add('bg-green-100', 'border-green-400');
  } else if (creativeLink) {
    creativeLink.classList.remove('bg-green-100', 'border-green-400');
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

  var dataToSave = {
    postCaption: document.getElementById('post-caption').value,
    socialNetwork: selectedNetworks,
    artGuidelines: document.getElementById('art-guidelines').value,
    artText: document.getElementById('art-text').value,
    finalCreativeLink: document.getElementById('final-creative-link').value,
    readyMediaLink: document.getElementById('ready-media-link').value,
    creativeFormat: document.getElementById('creative-format').value,
    postDate: document.getElementById('postDate').value,
    scheduledDate: document.getElementById('scheduledDate').value,
    clientProject: document.getElementById('clientProject').value,
    
    // Novos campos
    adMainText: document.getElementById('ad-main-text').value,
    adVariations: document.getElementById('ad-variations').value,
    adTitle1: document.getElementById('ad-title-1').value,
    adTitle2: document.getElementById('ad-title-2').value,
    adTitle3: document.getElementById('ad-title-3').value,
    adTitle4: document.getElementById('ad-title-4').value,
    aiAgentLink: document.getElementById('ai-agent-link').value,
    aiPromptSuggest: document.getElementById('ai-prompt-suggest').value
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
const tabs = ['post', 'ad', 'ia'];
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
    
    // Atualiza resize do iframe com timer leve por causa do 'hidden' display transition
    setTimeout(function() {
      t.sizeTo('#content');
    }, 1500);
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
    var encodedPrompt = encodeURIComponent(finalPrompt);
    
    var separator = aiLinkInput.includes('?') ? '&' : '?';
    var finalUrl = aiLinkInput + separator + "q=" + encodedPrompt;
    
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
