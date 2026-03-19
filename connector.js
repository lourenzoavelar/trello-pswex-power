/* global TrelloPowerUp */

TrelloPowerUp.initialize({
  'board-buttons': function(t, options) {
    return [{
      icon: {
        dark: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
        light: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png'
      },
      text: 'Gantt View',
      callback: function(t) {
        return t.modal({
          title: 'Gantt Chart',
          url: 'https://lourenzoavelar.github.io/trello-gantt-powerup/gantt.html',
          height: 600,
          fullscreen: true
        });
      }
    }];
  }
});
