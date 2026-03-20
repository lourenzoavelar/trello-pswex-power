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
    }];
  }
});
