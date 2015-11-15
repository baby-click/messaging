var path = require('path');
var morgan = require('morgan');
var express = require('express');
var debug = require('debug')('http');
var bodyParser = require('body-parser');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var methodOverride = require('method-override');

var app = express();
var usernames = {};

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(compression());
app.locals.basedir = path.join(__dirname, 'views');
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 86400000
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('view options', {
  layout: false,
  pretty: true
});
app.use(cookieParser());
app.use(expressSession({
  secret: 'secret',
  cookie: {
    maxAge: 60000
  },
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());

// routes
app.get('/', function(req, res) {
  res.render('chat', {
    title: 'Messaging',
  });
});

// socket
io.on('connection', function(socket) {
  debug('new connection to socket');
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
        username: socket.username
      });
    }
  });
});

// debug
app.use('*', function(req, res, next) {
  debug('express `req.session` data is %j.', req.session);
  next();
});

// server
server.listen(port, function() {
  console.log('Server listening at port %d', port);
});
