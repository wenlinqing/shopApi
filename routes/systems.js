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
    var userId=req.headers['userid']||''
    async.waterfall([
        function(callback){
            var sqlAll=`select count(1) as total from red_list where userId=${userId} and create_time between '`+moment().format('YYYY-MM-DD 00:00:00')+ `' and '` + moment().format('YYYY-MM-DD 23:59:59') + `'`;
            db.selectAll(sqlAll,(err,result)=>{
                if (err) {
                    console.log(err)
                    return res.json({
                        code:'500',
                        msg:'系统错误'
                    })
                }
                if (result[0].total!=0) {
                    res.json({
                        code:'200',
                        data:{
                            total:1,
                            red_activity:1
                        },
                        msg:'ok'
                    })
                    callback(new Error("aaa"));
                }else{
                    callback(null,2);// 今日没领过红包 继续往下走
                }
            })
        },
        function(data, callback){
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
                var result=result[0]
                result.total=0;
                res.json({
                    code:'200',
                    data:result,
                    msg:'ok'
                })
                callback(null,1);
            })
        }
    ], function(err, results){
        if (err) {
           console.log('err err err',err);
        }else{
            // console.log('results',results);
        }
    }); 
})


// 后台 获取销售记录 后台 获取销售记录 后台 获取销售记录 后台 获取销售记录 后台 获取销售记录
router.post('/getSalesRecord', function(req, res, next) {
    var page=req.body.page||1;
    var pageSize=req.body.pageSize||10;
    var title=req.body.title||'';
    // console.log(req.body)
    var sqlAll=`select count(1) as total from zhu_sales_record `;
    var total = '';
    if (title!='') {
        sqlAll+=` where username like ?`
        sqlAll = db.mysql.format(sqlAll, title);
    }
    db.selectAll(sqlAll,(err,result)=>{
        if (err) {
            console.log(err)
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        }
        total=result[0].total;

        if (total==0) {
            res.json({
                code:'200',
                page:page,
                pageSize:pageSize,
                totals:total,
                list:[],
                msg:'ok'
            })
            return
        }

        var sql=`select * from zhu_sales_record `;
        if (title!='') {
            sql+=`where username like ? order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
            sql = db.mysql.format(sql, title);
        }else{
            sql+=`order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
            sql = db.mysql.format(sql);
        }
        db.selectAll(sql,(err,result)=>{
            if (err) {
                console.log(err)
                return res.json({
                    code:'500',
                    msg:'系统错误'
                })
            }
            res.json({
                code:'200',
                page:page,
                pageSize:pageSize,
                totals:total,
                list:result,
                msg:'ok'
            })
        })
    })
});

router.post('/recordAdd',(req,res,next)=>{
    var saveDate={
        username:req.body.username,
        mobile:req.body.mobile,
        adress:req.body.adress,
        num:req.body.num,
        price:req.body.price,
        giftNum:req.body.giftNum,
        postage:req.body.postage,
        remark:req.body.remark,
        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
    }
    db.insertData('zhu_sales_record',saveDate,(err,result)=>{
        if (err) {
            console.log(err)
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        } 
        res.json({
            code:'200',
            msg:'ok'
        })
    })
})

router.post('/recordEdit',(req,res,next)=>{
    var _where = {id : req.body.id};
    var _set = {
        username:req.body.username,
        mobile:req.body.mobile,
        adress:req.body.adress,
        num:req.body.num,
        price:req.body.price,
        giftNum:req.body.giftNum,
        postage:req.body.postage,
        remark:req.body.remark,
    };
    db.updateData('zhu_sales_record',_set,_where,(err,result)=>{
        if (err) {
            console.log(err)
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        }

        res.json({
            code:'200',
            msg:'ok'
        })
    })
})

router.post('/recordDel', (req, res, next) => {
    db.deleteData('zhu_sales_record','id',req.body.id,(err,data)=>{
        if (err) {
            console.log(err)
            return res.json({
                code:'500',
                msg:'系统错误'
            })
        }
        res.json({
            code:'200',
            msg:'ok'
        })
    })
})



module.exports = router;
