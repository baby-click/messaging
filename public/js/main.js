var messaging = messaging || {};
var socket = io();

// selectors
var $messages = jQuery('#messages');
var $modalLogin = jQuery('#modalLogin');
var $messageInput = jQuery('#messageInput');
var $usernameModal = jQuery('#usernameModal');

// status
var connected = false;
var typing = false;
var username;

/**
 * work with a dedicated object
 */
messaging.ui = {
  init: function() {
    jQuery('.modal').modal('show');
    $usernameModal.focus();
  },

  update: function(data) {
    var messageString = data;
    var usernameString = '';

    if (data.message !== undefined) {
      messageString = data.message;
    }

    if (data.username !== undefined) {
      usernameString = '<strong>' + data.username + '</strong>: ';
    }

    twemoji.size = '16x16';
    messageString = twemoji.parse(messageString);
    $messages.append('<li class="messages padding-top-6 padding-right-12 padding-bottom-6 padding-left-12">' + usernameString + '' + messageString + '</li>');

    $messages.animate({
      scrollTop: $messages.get(0).scrollHeight
    }, 200);
  },

  login: function(formObject, event) {
    event.preventDefault();
    username = jQuery(formObject.username).val();

    if (username !== undefined && username.length > 0) {
      messaging.socket.init(username);
      $modalLogin.modal('hide');
      $messageInput.focus();
    }
  },

  sendMessage: function() {
    event.preventDefault();
    var message = jQuery.trim($messageInput.val());

    if (message && connected) {
      $messageInput.val('');
      messaging.ui.addMessage(message);
      socket.emit('new message', message);
    }
  },

  addMessage: function(data) {
    messaging.ui.update(data);
  },

  addMessageElement: function() {

  }
};

messaging.socket = {
  init: function(username) {
    socket.emit('add user', username);
  }
};

/**
 * listen on specific events
 */
socket.on('user joined', function(data) {
  messaging.ui.update(data.username + ' hat den raum betreten');
});

socket.on('user left', function(data) {
  messaging.ui.update(data.username + ' hat den Raum verlassen');
});

socket.on('login', function() {
  connected = true;
  var message = 'Hej ' + username + ' willkommen zurück';
  messaging.ui.update(message);
});

socket.on('new message', function(data) {
  messaging.ui.addMessage(data);
});

/**
 * initialize the chat
 */
(function() {
  messaging.ui.init();
})();
