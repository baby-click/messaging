var messaging = messaging || {};
var socket = io();

// selectors
var $body = jQuery('body');
var $messages = jQuery('#messages');
var $modalLogin = jQuery('#modalLogin');
var $messageInput = jQuery('#messageInput');
var $usernameInput = jQuery('#usernameInput');
var $usernameModal = jQuery('#usernameModal');

// define
var typingTimeout;
var username;

// status
var isConnected = false;
var isTyping = false;


/**
 * work with a dedicated object
 */
messaging.ui = {
  init: function() {
    jQuery('.modal').modal('show');
    $usernameInput.focus();
  },

  update: function(data) {
    var usernameLocal = username;
    var typingClassString = '';
    var messageString = data;
    var usernameString = '';

    if (data.typing !== undefined) {
      typingClassString = 'typing ';
    }

    if (data.message !== undefined) {
      messageString = data.message;
    }

    if (data.username !== undefined) {
      usernameLocal = data.username;
      usernameString = '<strong>' + usernameLocal + '</strong>: ';
    }

    twemoji.size = '16x16';
    messageString = twemoji.parse(messageString);

    jQuery('<li class="messages" />').attr('data-username', usernameLocal).addClass(typingClassString).html(usernameString + '' + messageString).appendTo($messages);

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

  addMessage: function(data) {
    var $typingMessage = messaging.ui.findTypingNote(data);

    if ($typingMessage.length !== 0) {
      $typingMessage.remove();
    }

    messaging.ui.update(data);
  },

  addTyping: function(data) {
    isTyping = true;
    data.typing = true;
    data.message = 'tippt gerade...';
    messaging.ui.addMessage(data);
  },

  removeTyping: function(data) {
    messaging.ui.findTypingNote(data).fadeOut(function() {
      jQuery(this).remove();
    });
  },

  updateTyping: function() {
    if (isConnected) {
      if (!isTyping) {
        socket.emit('typing');
      }

      if (typingTimeout !== undefined) {
        clearTimeout(typingTimeout);
      }

      typingTimeout = setTimeout(function() {
        socket.emit('stop typing');
      }, 450);
    }
  },

  findTypingNote: function(data) {
    return jQuery('.typing').filter(function() {
      return jQuery(this).data('username') === data.username;
    });
  },

  sendMessage: function() {
    event.preventDefault();

    // TODO should be assigned as parameter
    var message = jQuery.trim($messageInput.val());

    if (message && isConnected) {
      isTyping = false;
      $messageInput.val('');
      messaging.ui.addMessage(message);
      socket.emit('stop typing');
      socket.emit('new message', message);
    }
  }
};

messaging.socket = {
  init: function(username) {
    socket.emit('add user', username);
  }
};


/**
 * listen on specific socket events
 */
socket.on('user joined', function(data) {
  messaging.ui.update(data.username + ' hat den raum betreten');
});

socket.on('user left', function(data) {
  messaging.ui.update(data.username + ' hat den Raum verlassen');
});

socket.on('login', function() {
  isConnected = true;
  var message = 'Hej ' + username + ' willkommen zurück';
  messaging.ui.update(message);
});

socket.on('new message', function(data) {
  messaging.ui.addMessage(data);
});

socket.on('typing', function(data) {
  messaging.ui.addTyping(data);
});

socket.on('stop typing', function(data) {
  messaging.ui.removeTyping(data);
});


/**
 * eventlistener
 */
$messageInput.on('input', function() {
  messaging.ui.updateTyping();
});

$body.click(function() {
  if (isConnected) {
    $messageInput.focus();
  } else {
    $usernameInput.focus();
  }
});

/**
 * initialize the chat
 */
(function() {
  messaging.ui.init();
})();
