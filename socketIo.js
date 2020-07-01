var moment = require('moment');
var db = require('./mysql/mysql.js');
var express = require('express');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server); 

console.log("aaaaaa")
io.on('connection',function(socket){
    console.log('a user connected')
    socket.on('disconnect',function(){
        console.log('a user go out')
    })
    socket.on('message',function(obj){
        var sql = `select * from withdrawals_record where status=1`;
        db.selectAll(sql, (err, result) => {
            if (err) {
                console.log(err)
            }
            if (result.length!=0) {
                io.emit('message',JSON.stringify(result))
            }else{
                io.emit('message',[])
            }
        })
        setInterval(()=>{
            db.selectAll(sql, (err, result) => {
                if (err) {
                    console.log(err)
                }
                if (result.length!=0) {
                    io.emit('message',JSON.stringify(result))
                }else{
                    io.emit('message',[])
                }
            })
            console.log("jjjjjjjjjjj")
        },1000)
    })

})



server.listen(3000);
console.log('success listen at port:6000......');