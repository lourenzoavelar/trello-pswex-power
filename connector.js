/* global TrelloPowerUp */

const ENABLE_MIGRATION_TOOL = false;

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
  'show-settings': function(t, options) {
    return t.modal({
      title: 'Configurações de Clientes/Projetos',
      url: t.signUrl('./settings.html'),
      height: 350
    });
  },
  'card-badges': function(t, options) {
    return t.get('card', 'shared', 'customFieldsData')
      .then(function(data) {
        var badges = [];
        if (data) {
          if (data.clientProject) {
            badges.push({
              text: data.clientProject,
              color: 'blue'
            });
          }
          if (data.creativeFormat) {
            badges.push({
              text: data.creativeFormat,
              color: 'green'
            });
          }
        }
        return badges;
      });
  },
  'card-back-section': function(t, options) {
    return {
      title: '',
      icon: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
      content: {
        type: 'iframe',
        url: t.signUrl('./card-custom-fields.html'),
        height: 500
      }
    };
  }
});
