var moment = require('moment');
var db = require('./mysql/mysql.js');
let ws = require("nodejs-websocket");


console.log("start connnection");
var server = ws.createServer(function (conn) {
    conn.on("text", function (str) {
        var obj=JSON.parse(str)
        // console.log("msg is ", obj);
        try {
            // if (obj.type=="rider") {
                var riderId=obj.riderId;
                var orderTag=obj.orderTag;

                //订单状态 0待送货 1送货中 2成功 3用户取消 4骑手取消(用户不要了)
                if (orderTag==0) {// 待配送
                    var sql=`select * from order_order where status=0`;
                }else if (orderTag==1) {// 配送中
                    var sql=`select * from order_order where riderId=${riderId} and status=1  order by create_time desc`;
                }else if (orderTag==2) {// 配送成功
                    var sql=`select * from order_order where riderId=${riderId} and status=2  order by create_time desc`;
                }else{
                    var sql=`select * from order_order where riderId=${riderId} and (status=3 or status=4)  order by create_time desc`;
                }

                db.selectAll(sql, (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    // console.log('server.connections.length=',server.connections.length)
                    // if (result.length!=0) {
                        // server.connections.forEach((item,i)=>{
                        //     console.log('i==========',i)
                        //     item.send(JSON.stringify(result))
                        // })
                        conn.send(JSON.stringify(result))
                    // }
                })
            /*}else if(obj.type=="user"){
                var userId=obj.userId;
                var orderTag=obj.orderTag;

                //订单类型 0待送货 1送货中 2成功 3全部
                if (orderTag==0) {// 待配送
                    var sql=`select * from order_order where status=0`;
                }else if (orderTag==1) {// 配送中
                    var sql=`select * from order_order where userId=${userId} and status=1  order by create_time desc`;
                }else if (orderTag==2) {// 配送成功
                    var sql=`select * from order_order where userId=${userId} and status=2  order by create_time desc`;
                }else{// 3为查询全部订单
                    var sql=`select * from order_order where userId=${userId} order by create_time desc`;
                }
                db.selectAll(sql, (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    // console.log('server.connections.length=',server.connections.length)
                    if (result.length!=0) {
                        conn.send(JSON.stringify(result))
                    }
                })
            }*/
        }catch(err){
            console.log('err===========',err)
        }
            
        /*var sql = `select * from withdrawals_record where status=1`;
        setInterval(()=>{
            db.selectAll(sql, (err, result) => {
                if (err) {
                    console.log(err)
                }
                console.log('server.connections.length=',server.connections.length)
                if (result.length!=0) {
                    conn.send(JSON.stringify(result))
                }
                
            })
        },1000)*/
    });
  conn.on("close", function (code, reason) {
    console.log("close")
  });
  conn.on("error", function (code, reason) {
    console.log("error")
  })
}).listen(8082);
console.log("connnection over");




