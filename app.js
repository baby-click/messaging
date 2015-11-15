var express = require('express');
var path = require('path');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 86400000
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view options', {
  layout: false,
  pretty: true
});

// routes
app.get('/', function(req, res) {
  res.render('chat', {
    title: 'Messaging',
  });
});


var usernames = {};

io.on('connection', function(socket) {
  var addedUser = false;

  socket.on('new message', function(data) {
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('add user', function(username) {
    socket.username = username;
    usernames[username] = username;
    addedUser = true;

    socket.emit('login', {});

    socket.broadcast.emit('user joined', {
      username: socket.username,
    });
  });

  socket.on('typing', function() {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', function() {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', function() {
    if (addedUser) {
      delete usernames[socket.username];

      socket.broadcast.emit('user left', {
        username: socket.username,
      });    }
  });
});
