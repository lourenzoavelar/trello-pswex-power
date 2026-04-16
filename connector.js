/* global TrelloPowerUp */

TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
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
    },
    {
        icon: 'https://app.amazingpowerups.com/assets/section_icon_list-alt.svg',
        text: 'Migrar Amazing Fields',
        callback: function (t) {
            return t.modal({
                title: 'Ferramenta de Migração',
                url: './migrate.html',
                height: 500
            });
        }
    }];
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
