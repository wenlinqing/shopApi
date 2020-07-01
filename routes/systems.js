var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../mysql/mysql.js');
var schedule = require('node-schedule');

var async = require("async");

// 后台统计
router.get('/api/admin/getMember', (req, res, next) => {
    // 查询总用户
    var sql = `select count(1) as allTotal from users`;
    var allTotal = 0;
    db.selectAll(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        allTotal = result[0].allTotal;
    })

    // 查询 今日新增
    var sql2 = `select count(1) as todayTotal from users where create_time between '` + moment().format('YYYY-MM-DD 00:00:00') + `' and '` + moment().format('YYYY-MM-DD 23:59:59') + `'`;

    var todayTotal = 0;
    db.selectAll(sql2, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        todayTotal = data[0].todayTotal;
    })

    // 查询 昨天
    var sql2 = `select count(1) as yesTodayTotal from users where create_time between '` + moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'`;

    var yesTodayTotal = 0;
    db.selectAll(sql2, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        yesTodayTotal = data[0].yesTodayTotal;
    })


    // 查询 最近七天
    var sql5 = `select count(1) as last7Days from users where create_time between '`
        + moment().subtract(7, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().subtract(1, 'days').format('YYYY-MM-DD 23:59:59') + `'`;
    var last7Days = 0;
    db.selectAll(sql5, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        last7Days = data[0].last7Days;
    })

    // 查询 当月
    var sql3 = `select count(1) as curMonth from users where create_time between '`
        + moment().add(0, 'month').format('YYYY-MM-01 00:00:00') + `' and '` + moment(moment().add(0, 'month').format('YYYY-MM-01 00:00:00')).add(1, 'month').add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'`;
    var curMonth = 0;
    db.selectAll(sql3, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        curMonth = data[0].curMonth;
    })

    // 查询 上月
    var sql4 = `select count(1) as passMonth from users where create_time between '`
        + moment().add(-1, 'month').format('YYYY-MM-01 00:00:00') + `' and '` + moment(moment().add(-1, 'month').format('YYYY-MM-01 00:00:00')).subtract(-1, 'month').add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'`;
    var passMonth = 0;
    db.selectAll(sql4, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        passMonth = data[0].passMonth;

        res.json({
            code: '200',
            data: {
                allTotal: allTotal,
                todayTotal: todayTotal,
                yesTodayTotal: yesTodayTotal,

                last7Days: last7Days,
                curMonth: curMonth,
                passMonth: passMonth,
            },
            msg: 'ok'
        })
    })
})


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
