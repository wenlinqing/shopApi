var express = require('express');
var router = express.Router();
var moment = require('moment');

const pathLib = require('path');
const fs = require('fs');
const md5 = require('md5');

var jwt = require('jsonwebtoken');
var secretOrPrivateKey = "NHWJ8888"  //加密token 校验token时要使用

var db = require('../mysql/mysql.js');


// web接口  web接口  web接口  web接口  web接口  web接口  web接口  web接口  web接口


router.post('/api/login', (req, res, next) => {
    var mobile = req.body.mobile;
    var password = req.body.password;
    var type = req.body.type||req.headers['roletype'];
    // console.log(type,req.headers['roletype'])
    
    if (type == 'web' || type=='admin') {
        var sql = `select * from users where mobile=?`;
    } else if (type == 'riders') {
        var sql = `select * from riders where mobile=?`;
    }
    sql = db.mysql.format(sql,mobile);// 预防SQL注入
    db.selectAll(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        if (result.length == 0) {
            return res.json({
                code: '444',
                msg: '账号不存在'
            })
        }

        if (result.length != 0 && result[0].password != password) {
            return res.json({
                code: '444',
                msg: '账号或密码错误'
            })
        }
        if (result[0].locked != 0) { //  0可用  1冻结
            return res.json({
                code: '444',
                msg: '该账号已冻结，请联系客服'
            })
        }

        delete result[0].password // 删除 登录密码字段
        delete result[0].locked // 删除字段
        
        result[0].token='Bearer '+jwt.sign({
            tokenId: result[0].userId,
            data: result[0]
        }, secretOrPrivateKey, {
            expiresIn: '7d'
        })
        return res.json({
            code: '200',
            userInfo: result[0],
            msg: 'ok'
        })
    })
})


// 用户注册  或者 找回密码
router.post('/api/regist', (req, res, next) => {
    var mobile = req.body.mobile;
    var actionType = req.body.actionType; // regist 注册   forget 找回密码
    var type = req.body.type;
    if (type == 'web') {// 普通用户
        var sql = `select * from users where mobile=?`;
    }
    if (type == 'riders') {// 骑手注册
        var sql = `select * from riders where mobile=?`;
    }
    sql = db.mysql.format(sql,mobile);// 预防SQL注入

    db.selectAll(sql, (err, result) => { // 查询是否存在
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        if (actionType == 'regist') {// regist 注册
            if (result.length == 1) {
                return res.json({
                    code: '444',
                    msg: '账号已存在'
                })
            }

            // 插入注册用户
            var iddd = (moment().format('YYMMDDHHmm')).toString() + (Number(Math.random().toString().substr(3, 12)) + Date.now()).toString()
            if (type == 'web') {
                var table='users'
                var saveDate = {
                    userId: iddd,
                    username: req.body.username,
                    mobile: req.body.mobile,
                    password: req.body.password,
                    tradePwd: req.body.tradePwd,
                    roleType:'web',// users表中 roleType=web为普通用户  roleType=admin为系统管理员
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                }
            }
            if (type == 'riders') {
                var table='riders'
                var saveDate = {
                    riderId: iddd,
                    riderName:req.body.riderName,
                    mobile: req.body.mobile,
                    password: req.body.password,
                    withdrawal_account: req.body.withdrawal_account,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                }
            }
            db.insertData(table, saveDate, (err, data) => {
                if (err) {
                    console.log(err)
                    return res.json({
                        code: '500',
                        msg: '系统错误'
                    })
                }

                res.json({
                    code: '200',
                    msg: 'ok'
                })
            })

        }
        if (actionType == 'forget') {//forget 找回密码
            if (result.length == 0) {
                return res.json({
                    code: '444',
                    msg: '账号不存在'
                })
            }
            if (type == 'web') {
                var table='users'
                var _where = {mobile: req.body.mobile};
            }
            if (type == 'riders') {
                var table='riders'
                var _where = {mobile: req.body.mobile};
            }

            var _set = {
                password: req.body.password,
            };

            db.updateData(table, _set, _where, (err, result) => {
                if (err) {
                    console.log(err)
                    return res.json({
                        code: '500',
                        msg: '系统错误'
                    })
                }

                res.json({
                    code: '200',
                    msg: 'ok'
                })
            })
        }
    })
})

// 更新用户信息
router.post('/api/updateUserInfo', (req, res, next) => {
    // var sql2 = `select pwd from jgb_user where user_id='` + req.body.user_id + `'`;
    var type = req.body.type;
    if (type == 'web') {// 普通用户
        var sql = `select password from users where userId=?`;
        sql = db.mysql.format(sql,req.body.userId);// 预防SQL注入
    }
    if (type == 'riders') {// 骑手注册
        var sql = `select password from riders where riderId=?`;
        sql = db.mysql.format(sql,req.body.riderId);// 预防SQL注入
    }

    db.selectAll(sql, (err, data) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        if (data[0].password != req.body.password) { // 检验原密码是否正确
            return res.json({
                code: '505',
                msg: '原密码错误'
            })
        } else {
            if (type == 'web') {
                var table='users'
                var _where = {userId: req.body.userId, password: req.body.password};
                var _set = {
                    username: req.body.username,
                    mobile: req.body.mobile,
                };
            }
            if (type == 'riders') {
                var table='riders'
                var _where = {riderId: req.body.riderId, password: req.body.password};
                var _set = {
                    riderName: req.body.riderName,
                    mobile: req.body.mobile,
                };
            }
            if (req.body.passwordNew!='') { // 判断是否要覆盖原密码
                _set.password = req.body.passwordNew
            }
            db.updateData(table, _set, _where, (err, result) => {
                if (err) {
                    console.log(err)
                    return res.json({
                        code: '500',
                        msg: '系统错误'
                    })
                }

                res.json({
                    code: '200',
                    msg: 'ok'
                })
            })
        }
    })

})
// 查询用户信息
router.post('/api/queryUserInfo', (req, res, next) => {
    var sql = `select userId,username,mobile from users where user_id=?`;
    sql = db.mysql.format(sql,req.body.user_id);// 预防SQL注入
    db.selectAll(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }
        res.json({
            code: '200',
            data: result[0],
            msg: 'ok'
        })
    })
})


// 退出登录
router.post('/api/loginOut', (req, res, next) => {
    res.json({
        code: '200',
        msg: 'ok'
    })
})



///////////////////////////////////////////////////////////////////////////////////////////////
// 用户地址 增删改查
router.post('/api/address/addressList', (req, res, next) => {
    var sql = `select * from address where userId=? order by create_time desc`;
    // console.log(req.headers['userid'])
    sql = db.mysql.format(sql, req.headers['userid']);

    db.selectAll(sql, (err, result) => {
        if (err) {
            console.log(err)
            return res.json({
                code: '500',
                msg: '系统错误'
            })
        }

        res.json({
            code: '200',
            list: result,
            msg: 'ok'
        })
    })
})
router.post('/api/address/add', (req, res, next) => {
    if (req.body.isDefault) {// 添加时有设置默认地址
        var sql = `select * from address where userId=?`;
        sql = db.mysql.format(sql, req.headers['userid']);
        db.selectAll(sql, (err, result) => {
            if (err) {
                console.log(err)
                return res.json({
                    code: '500',
                    msg: '系统错误'
                })
            }
            if (result.length>0) {// 当前用户存在地址  全部设为不默认
                let _where = {userId : req.headers['userid']};
                let _set = {
                    isDefault:0,
                };
                db.updateData('address',_set,_where,(err,result)=>{
                    if (err) {
                        console.log(err)
                        return res.json({
                            code:'500',
                            msg:'系统错误'
                        })
                    }
                    // 再添加
                    var addressId=(moment().format('YYYYMMDD')).toString() + Date.now().toString().substr(0,10)
                    var saveDate={
                        addressId:addressId,
                        userId:req.headers['userid'],
                        receiverName:req.body.receiverName,
                        receiverTel:req.body.receiverTel,
                        houseNumber:req.body.houseNumber,

                        province:req.body.province,
                        city:req.body.city,
                        district:req.body.district,
                        receiverStreet:req.body.receiverStreet,
                        lng:req.body.lng,
                        lat:req.body.lat,
                        isDefault:req.body.isDefault,
                        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
                    }
                    db.insertData('address',saveDate,(err,result)=>{
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
            }else{
                var addressId=(moment().format('YYYYMMDD')).toString() + Date.now().toString().substr(0,10)
                    var saveDate={
                        addressId:addressId,
                        userId:req.headers['userid'],
                        receiverName:req.body.receiverName,
                        receiverTel:req.body.receiverTel,
                        houseNumber:req.body.houseNumber,

                        province:req.body.province,
                        city:req.body.city,
                        district:req.body.district,
                        receiverStreet:req.body.receiverStreet,
                        lng:req.body.lng,
                        lat:req.body.lat,
                        isDefault:req.body.isDefault,
                        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
                    }
                    db.insertData('address',saveDate,(err,result)=>{
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
            }
        })
    }else{// 没有设置默认地址  直接添加
        var addressId=(moment().format('YYYYMMDD')).toString() + Date.now().toString().substr(0,10)
        var saveDate={
            addressId:addressId,
            userId:req.headers['userid'],
            receiverName:req.body.receiverName,
            receiverTel:req.body.receiverTel,
            houseNumber:req.body.houseNumber,

            province:req.body.province,
            city:req.body.city,
            district:req.body.district,
            receiverStreet:req.body.receiverStreet,
            lng:req.body.lng,
            lat:req.body.lat,
            isDefault:req.body.isDefault,
            create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
        }
        db.insertData('address',saveDate,(err,result)=>{
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
    }  
})

router.post('/api/adress/delete', (req, res, next) => {
    db.deleteData('address','addressId',req.body.addressId,(err,data)=>{
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

router.post('/api/address/edit', (req, res, next) => {
    if (req.body.isDefault) {// 添加时有设置默认地址
        var sql = `select * from address where userId=?`;
        sql = db.mysql.format(sql, req.headers['userid']);
        db.selectAll(sql, (err, result) => {
            if (err) {
                console.log(err)
                return res.json({
                    code: '500',
                    msg: '系统错误'
                })
            }
            if (result.length>0) {// 当前用户存在地址  全部设为不默认
                let _where = {userId : req.headers['userid']};
                let _set = {
                    isDefault:0,
                };
                db.updateData('address',_set,_where,(err,result)=>{
                    if (err) {
                        console.log(err)
                        return res.json({
                            code:'500',
                            msg:'系统错误'
                        })
                    }
                    // 再添加
                    var _where = {addressId : req.body.addressId};
                    var _set = {
                        receiverName:req.body.receiverName,
                        receiverTel:req.body.receiverTel,
                        houseNumber:req.body.houseNumber,

                        province:req.body.province,
                        city:req.body.city,
                        district:req.body.district,
                        receiverStreet:req.body.receiverStreet,
                        lng:req.body.lng,
                        lat:req.body.lat,

                        isDefault:req.body.isDefault?1:0,
                    };
                    db.updateData('address',_set,_where,(err,result)=>{
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
            }
        })
    }else{// 没有设置默认地址  直接添加
        var _where = {addressId : req.body.addressId};
        var _set = {
            receiverName:req.body.receiverName,
            receiverTel:req.body.receiverTel,
            houseNumber:req.body.houseNumber,

            province:req.body.province,
            city:req.body.city,
            district:req.body.district,
            receiverStreet:req.body.receiverStreet,
            lng:req.body.lng,
            lat:req.body.lat,

            isDefault:req.body.isDefault,
        };
        db.updateData('address',_set,_where,(err,result)=>{
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
    }
})


module.exports = router;
