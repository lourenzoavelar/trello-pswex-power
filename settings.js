var t = TrelloPowerUp.iframe();

function renderClients(clients) {
    var ul = document.getElementById('clients-list');
    ul.innerHTML = '';
    
    if (clients.length === 0) {
        ul.innerHTML = '<li class="text-xs text-gray-500 italic">Nenhum cliente cadastrado.</li>';
        t.sizeTo('body');
        return;
    }

    clients.forEach(function(client, index) {
        var li = document.createElement('li');
        li.className = "flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200 shadow-sm";
        
        var span = document.createElement('span');
        span.className = "font-medium text-gray-700 truncate mr-2 w-full";
        span.textContent = client;
        
        var removeBtn = document.createElement('button');
        removeBtn.className = "text-red-500 hover:text-red-700 transition-colors p-1 flex items-center justify-center rounded hover:bg-red-50";
        removeBtn.innerHTML = '<i class="fa-solid fa-trash text-xs"></i>';
        removeBtn.title = "Remover Cliente";
        
        removeBtn.addEventListener('click', function() {
            clients.splice(index, 1);
            saveClients(clients);
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        ul.appendChild(li);
    });

    t.sizeTo('body');
}

function saveClients(clients) {
    t.set('board', 'shared', 'clientsList', clients).then(function() {
        renderClients(clients);
    });
}

t.render(function() {
    Promise.all([
        t.get('board', 'shared', 'clientsList'),
        t.get('board', 'shared', 'n8nPublishUrl'),
        t.get('board', 'shared', 'n8nDownloadUrl')
    ]).then(function(values) {
        var clients = values[0] || [];
        var pubUrl = values[1] || '';
        var downUrl = values[2] || '';

        var currentClients = clients;
        renderClients(currentClients);
        
        document.getElementById('n8nPublishUrl').value = pubUrl;
        document.getElementById('n8nDownloadUrl').value = downUrl;

        document.getElementById('add-client-form').onsubmit = function(e) {
            e.preventDefault();
            var input = document.getElementById('newClientName');
            var val = input.value.trim();
            if (val) {
                if(!currentClients.includes(val)) {
                    currentClients.push(val);
                    saveClients(currentClients);
                }
                input.value = '';
            }
        };

        document.getElementById('endpoints-form').onsubmit = function(e) {
            e.preventDefault();
            var pub = document.getElementById('n8nPublishUrl').value.trim();
            var down = document.getElementById('n8nDownloadUrl').value.trim();
            
            Promise.all([
                t.set('board', 'shared', 'n8nPublishUrl', pub),
                t.set('board', 'shared', 'n8nDownloadUrl', down)
            ]).then(function() {
                var feedback = document.getElementById('feedback-endpoints');
                feedback.classList.remove('hidden');
                setTimeout(function() {
                    feedback.classList.add('hidden');
                }, 3000);
            });
        };
    });
});
