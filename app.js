var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer');

var expressJWT = require('express-jwt')

// var jwt = require('jsonwebtoken');

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




app.use('/', require('./routes/index'));
app.use('/api/users', require('./routes/users'));
app.use('/api/product', require('./routes/product'));
app.use('/api/order', require('./routes/order'));
app.use('/api/riders', require('./routes/riders'))
app.use('/api/systems', require('./routes/systems'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

var secretOrPrivateKey = "NHWJ8888"  //加密token 校验token时要使用
app.use(expressJWT({
    secret: secretOrPrivateKey,
    // credentialsRequired: false
}).unless({//除了这个地址，其他的URL都需要验证
    path: [
        '/api/regist',
        '/api/login',
        '/api/product/getDataList'
    ]
}));


app.use(function (error, req, res, next) {
    if (error.name === 'UnauthorizedError') {   
        return res.json({
            code: 401,
            msg: error.message
        })
    }
});


module.exports = app;
