var t = TrelloPowerUp.iframe();

t.render(function() {
  t.get('card', 'shared', 'customFieldsData').then(function(data) {
    if (data) {
      document.getElementById('post-caption').value = data.postCaption || '';
      document.getElementById('social-network').value = data.socialNetwork || '';
      document.getElementById('art-guidelines').value = data.artGuidelines || '';
      document.getElementById('art-text').value = data.artText || '';
      document.getElementById('final-creative-link').value = data.finalCreativeLink || '';
      document.getElementById('ready-media-link').value = data.readyMediaLink || '';
      document.getElementById('creative-format').value = data.creativeFormat || '';
    }
  }).then(function() {
    t.sizeTo('#content');
  });
});

document.getElementById('btn-save').addEventListener('click', function() {
  var dataToSave = {
    postCaption: document.getElementById('post-caption').value,
    socialNetwork: document.getElementById('social-network').value,
    artGuidelines: document.getElementById('art-guidelines').value,
    artText: document.getElementById('art-text').value,
    finalCreativeLink: document.getElementById('final-creative-link').value,
    readyMediaLink: document.getElementById('ready-media-link').value,
    creativeFormat: document.getElementById('creative-format').value
  };

  t.set('card', 'shared', 'customFieldsData', dataToSave).then(function() {
    var feedback = document.getElementById('feedback-save');
    feedback.style.display = 'inline';
    setTimeout(function() {
      feedback.style.display = 'none';
      t.sizeTo('#content');
    }, 3000);
  });
});

document.getElementById('btn-copy-caption').addEventListener('click', function() {
  var captionText = document.getElementById('post-caption').value;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(captionText).then(function() {
      showCopyFeedback();
    }).catch(function(err) {
      fallbackCopyTextToClipboard(captionText);
    });
  } else {
    fallbackCopyTextToClipboard(captionText);
  }
});

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Evitar scroll
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    if (successful) {
      showCopyFeedback();
    }
  } catch (err) {
    console.error('Fallback: Falha ao copiar texto', err);
  }

  document.body.removeChild(textArea);
}

function showCopyFeedback() {
  var feedback = document.getElementById('feedback-copy');
  feedback.style.display = 'inline';
  setTimeout(function() {
    feedback.style.display = 'none';
  }, 2000);
}
