var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const session = require('express-session');
var logger = require('morgan');
const multer = require('multer');

var app = express();

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use(cookieParser());
app.use(session({
    secret: '@123456@',
    name: 'sessions',
    cookie:{maxAge: 600000},
    resave:false,
    saveUninitialized:true
}));





// app.use(multer({dest:'./public/upload'}).any());

//处理图片缩放
// app.use('/', require('./routes/image'));

// app.use(multer({dest: '/www/newwww/images'}).any());
// app.use('/public', express.static(__dirname + '/public'));


app.use('/shopApi/', require('./routes/index'));
app.use('/shopApi/api/users', require('./routes/users'));
app.use('/shopApi/api/product', require('./routes/product'));
app.use('/shopApi/api/order', require('./routes/order'));
// app.use('/api/enterprise', require('./routes/enterprise'));
// app.use('/api/banner', require('./routes/banner'));
// app.use('/api/comment', require('./routes/comment'));
app.use('/shopApi/api/riders', require('./routes/riders'))


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
