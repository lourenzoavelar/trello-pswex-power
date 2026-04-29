var t = window.TrelloPowerUp.iframe();

// Obter argumentos enviados na abertura do modal
var initialCaption = t.arg('caption') || '';

document.getElementById('modal-caption').value = initialCaption;

// Botões
var btnConfirm = document.getElementById('btn-confirm-publish');
var btnCancel = document.getElementById('btn-cancel');
var errorMsg = document.getElementById('modal-error');
var successMsg = document.getElementById('modal-feedback');

// Cancelar fecha modal
btnCancel.addEventListener('click', function() {
  t.closeModal();
});

// Confirmar
btnConfirm.addEventListener('click', function() {
  var newCaption = document.getElementById('modal-caption').value;
  
  // Atualiza campo (caso alterado) e depois dispara publicacao
  btnConfirm.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';
  btnConfirm.disabled = true;
  btnConfirm.classList.add('opacity-70', 'cursor-not-allowed');
  errorMsg.classList.add('hidden');
    t.get('card', 'shared', 'customFieldsData').then(function(data) {
    var updatedData = data || {};
    updatedData.postCaption = newCaption;
    return t.set('card', 'shared', 'customFieldsData', updatedData);
  })
    .then(function() {
      return t.get('board', 'shared', 'n8n_publish_url');
    })
    .then(function(url) {
      if (!url) {
        throw new Error("URL de Publicação não configurada.");
      }

      var cardId = t.arg('cardId');
      var boardId = t.arg('boardId') || t.getContext().board;

      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: cardId,
          boardId: boardId,
          action: 'publish'
        })
      });
    })
    .then(function(response) {
      if (!response.ok) {
        return response.text().then(function(txt) {
          throw new Error(txt || 'Erro ao comunicar com o n8n');
        });
      }
      return response.json().catch(function() { return {}; });
    })
    .then(function(json) {
      successMsg.classList.remove('hidden');
      setTimeout(function() {
        t.closeModal();
      }, 2000);
    })
    .catch(function(err) {
      errorMsg.textContent = "Erro: " + err.message;
      errorMsg.classList.remove('hidden');
      btnConfirm.innerHTML = '<i class="fa-brands fa-instagram"></i> Confirmar e Publicar';
      btnConfirm.disabled = false;
      btnConfirm.classList.remove('opacity-70', 'cursor-not-allowed');
    });
});

// Renderizar anexo em preview
t.card('attachments').then(function(card) {
  var container = document.getElementById('media-preview-container');
  var attachments = card.attachments || [];
  
  // Vamos tentar achar a imagem mais recente ou video
  // Trello retorna urls de preview tambem
  if (attachments.length > 0) {
    // Pega o ultimo anexo como heuristica
    var lastAttachment = attachments[attachments.length - 1];
    var isImage = lastAttachment.url.match(/\.(jpeg|jpg|gif|png)$/) != null || 
                 (lastAttachment.previews && lastAttachment.previews.length > 0);
                 
    var isVideo = lastAttachment.url.match(/\.(mp4|mov|avi)$/) != null;

    container.innerHTML = ''; // limpa loading
    
    if (isImage) {
      // pega preview maior
      var bestPreview = lastAttachment.url;
      if (lastAttachment.previews && lastAttachment.previews.length > 0) {
        bestPreview = lastAttachment.previews[lastAttachment.previews.length - 1].url;
      }
      
      var img = document.createElement('img');
      img.src = bestPreview;
      img.className = 'w-full h-full object-contain max-h-[300px]';
      container.appendChild(img);
      
    } else if (isVideo) {
      var vid = document.createElement('video');
      vid.src = lastAttachment.url;
      vid.controls = true;
      vid.className = 'w-full h-full object-contain max-h-[300px]';
      container.appendChild(vid);
      
    } else {
      // outro arquivo
      container.innerHTML = '<i class="fa-solid fa-file text-5xl text-gray-400 mb-2"></i><p class="text-gray-500 font-semibold">' + lastAttachment.name + '</p>';
    }
  } else {
    container.innerHTML = '<p class="text-sm text-gray-500 flex flex-col items-center"><i class="fa-solid fa-image-slash text-4xl mb-2 text-gray-300"></i> Nenhum anexo encontrado neste card.</p>';
  }
});
