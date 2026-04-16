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
    t.get('board', 'shared', 'clientsList').then(function(clients) {
        var currentClients = clients || [];
        renderClients(currentClients);
        
        document.getElementById('add-client-form').onsubmit = function() {
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
    });
});
