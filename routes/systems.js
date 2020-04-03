var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../mysql/mysql.js');
var schedule = require('node-schedule');


// 后台启动红包
router.post('/startRed',(req,res,next)=>{
    var sql=`select red_endTime from systems`
    db.selectAll(sql,(err,result)=>{
        if (err) {
            console.log(err)
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        }
        var red_endTime=result[0].red_endTime;
        // console.log('red_endTime=',moment(red_endTime).format('YYYY-MM-DD HH:mm:ss'))
        const sch=schedule.scheduleJob(moment(red_endTime).format('YYYY-MM-DD HH:mm:ss'), function(){
            // console.log('scheduleCronstyle:' + moment().format('YYYY-MM-DD HH:mm:ss'));
            var _where = {id : 1};
            var _set = {
                red_activity:0
            };
            db.updateData('systems',_set,_where,(err1,result)=>{
                if (err1) {
                    console.log(err1)
                    callback(new Error("system error"));
                    return res.json({
                        code:'500',
                        msg:'系统错误'
                    })
                }
                console.log('red active end')
                sch.cancel();
            })
        }); 

        res.json({
            code:'200',
            msg:'ok'
        })
    })
})

router.post('/getRedParama',(req,res,next)=>{
    var sql=`select withdrawalMoney,red_activity,red_startTime,red_endTime from systems`
    db.selectAll(sql,(err1,result)=>{
        if (err1) {
            console.log(err1)
            callback(new Error("system error"));
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        }
        res.json({
            code:'200',
            data:result[0],
            msg:'ok'
        })
    })
})




module.exports = router;
