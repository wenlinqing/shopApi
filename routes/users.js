var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../mysql/mysql.js');
var async = require("async");

// 后台 获取用户列表 后台 获取用户列表 后台 获取用户列表 后台 获取用户列表 后台 获取用户列表
router.post('/getDataList', function(req, res, next) {
	var page=req.body.page||1;
	var pageSize=req.body.pageSize||10;
	var title=req.body.title||'';
	// console.log(req.body)
	var sqlAll=`select count(1) as total from users `;
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

		var sql=`select userId,username,mobile,roleType,newcomer,reportsNum,locked,create_time from users `;
		if (title!='') {
			// sql+=`where username= `+title+` order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize; // 这种方式有sql注入风险  字符串拼接
			sql+=`where username like ? order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
			sql = db.mysql.format(sql, title);
		}else{
			sql+=`order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
			sql = db.mysql.format(sql);
		}
		// console.log(sql)  delete result[0].pwd // 删除 登录密码字段
		db.selectAll(sql,(err,result)=>{
			if (err) {
				console.log(err)
				return res.json({
					code:'500',
					msg:'系统错误'
				})
			}

			if (page==1) {
				var firstObj=result[result.length-1]
				result.splice(result.length-1,1)
				result.unshift(firstObj)
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


router.post('/enabledUser',(req,res,next)=>{
    var _where = {userId : req.body.userId};
    var _set = {
    	locked:req.body.locked
	    // modify_time:moment().format('YYYY-MM-DD HH:mm:ss'),
    };
	db.updateData('users',_set,_where,(err,result)=>{
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

// 用户资产信息 用户资产信息 用户资产信息 用户资产信息 用户资产信息 用户资产信息 用户资产信息
router.post('/userAssets',(req,res,next)=>{
	if (!req.body.userId ) {
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	var sql=`select amount_available as enabledMoney,used_amount as usedMoney from users where userId=${req.body.userId}`;
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
			data:result[0],
			msg:'ok'
		})
	})
})


// 用户个人订单  用户个人订单  用户个人订单  用户个人订单  用户个人订单 
router.post('/order',(req,res,next)=>{
	var userId=req.body.userId;
	var orderTag=req.body.orderTag;
	var actionList=[0,1,2,3]
	if (actionList.indexOf(orderTag)==-1 || !req.body.userId) {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		// return
	}
	
	//订单类型 0待送货 1送货中 2成功 3全部
	if (orderTag==0) {// 待配送
		var sql=`select * from order_order where status=0`;
	}else if (orderTag==1) {// 配送中
		var sql=`select * from order_order where userId=? and status=1  order by create_time desc`;
		sql = db.mysql.format(sql, userId);
	}else if (orderTag==2) {// 配送成功
		var sql=`select * from order_order where userId=? and status=2  order by create_time desc`;
		sql = db.mysql.format(sql, userId);
	}else{// 3为查询全部订单
		var sql=`select * from order_order where userId=? order by create_time desc`;
		sql = db.mysql.format(sql, userId);
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
			list:result,
			msg:'ok'
		})
	})
})
//  用户个人取消订单 用户个人取消订单 用户个人取消订单 用户个人取消订单
router.post('/cancelOrder',(req,res,next)=>{
	var orderNo=req.body.orderNo;
	var actions=req.body.actions;
	var obj=req.body.items;
	var actionList=[0]
	if (actionList.indexOf(actions)==-1||!req.body.orderNo) {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		// return
	}
	async.waterfall([
	    function(callback){
	    	if (obj.payWay==0) {
	    		callback(null,1)
	    	}else if (obj.payWay==1) {
				var updateSql = `update users set amount_available=amount_available+${obj.totalPrice},used_amount=used_amount-${obj.totalPrice} where userId=${obj.userId}`;
				db.connection.query(updateSql, (error, results) => {
					if (error) {
						console.log(error)
						callback(new Error("system error"));
						return res.json({
							code: '500',
							msg: '系统错误'
						})
					}
					callback(null,'user money return back');
				})
	    	}else{
	    		callback(new Error("order not exits"));
	    		return res.json({
					code:'504',
					msg:'参数错误'
				})
	    	}
	    },
	    function(data,callback){
	    	//用户不要了 取消订单
			var _where = {orderNo : req.body.orderNo};
		    var _set = {
		        status:3,
		        isDelive:1,
		        delive_time:moment().format('YYYY-MM-DD HH:mm:ss')
		    };

		    db.updateData('order_order',_set,_where,(err,result)=>{
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
	    },
	], function(err, results){
	    if (err) {
		   console.log('err err err',err);
	    }else{
			console.log('results',results);
	    }
	});	
})


// 查询系统充值活动表 查询系统充值活动表 查询系统充值活动表 查询系统充值活动表
router.post('/web/getRechargeItem',(req,res,next)=>{
	var sql=`select * from recharges`;
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
			list:result,
			msg:'ok'
		})
	})
})

// 用户充值操作 用户充值操作 用户充值操作 用户充值操作 用户充值操作 用户充值操作 用户充值操作
router.post('/web/recharge',(req,res,next)=>{
	if (!req.body.rechargeNo||!req.body.userId|| req.body.recharge_way==undefined) {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		// return
	}
	async.waterfall([
	    function(callback){
	    	var sql=`select * from users where userId=${req.body.userId}`;

			db.selectAll(sql,(err,result)=>{
				if (err) {
					callback(new Error("system error"))
					console.log(err)
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				if (result.length==0) {
					callback(new Error("system error"))
					return res.json({
						code:'500',
						msg:'用户不存在'
					})
				}else{
					callback(null,1)
				}
			})
	    },
	    function(data,callback){
	    	var sql=`select * from recharges where rechargeNo='${req.body.rechargeNo}'`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					callback(new Error("system error"))
					console.log(err)
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				if (result.length==0) {
					callback(new Error("system error"))
					return res.json({
						code:'500',
						msg:'该充值项不存在'
					})
				}else{
					callback(null,result[0])
				}
			})
	    },
	    function(rechargeObj,callback){
	    	var saveDate={
	    		orderNo:'No'+(moment().format('YYMMDD')).toString() + Date.now().toString().substr(0,12),
				userId:req.body.userId,
				money:rechargeObj.money,// 充值金额从表取数据
				recharge_bonus:rechargeObj.gift,// 充值赠送金额
				remark:'用户充值',
				type:1,// 1 充值  2消费
				status:1,// 充值：1待审核 2成功  3失败
				recharge_way:req.body.recharge_way,
				create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
			}
			db.insertData('user_assets_detail',saveDate,(err,result)=>{
				if (err) {
					console.log('error=====',err)
					callback(new Error("user recharge failed"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				callback(null,1);
				res.json({
					code:'200',
					msg:'ok'
				})
			})
	    }
	], function(err, results){
	    if (err) {
		   console.log('err err err',err);
	    }else{
			console.log('results',results);
	    }
	});	
})


// 用户充值申请记录 用户充值申请记录 用户充值申请记录 用户充值申请记录 用户充值申请记录 用户充值申请记录 用户充值申请记录 用户充值申请记录
router.post('/web/userAssetsDetail',(req,res,next)=>{
	var types=req.headers['authorization'];
	if (types!='admin') {// 用户自查
		if (!req.body.userId) {
			res.json({
				code:'504',
				msg:'参数错误'
			})
			return
		}
		var sql = `select * from user_assets_detail where userId=?`;
	    sql = db.mysql.format(sql,req.body.userId);// 预防SQL注入
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
	}else{ // 后台查询所有用户充值情况
		async.waterfall([
			function(callback){
				var sqlAll=`select count(1) as total from user_assets_detail where type=1`;
				db.selectAll(sqlAll,(err,result)=>{
					if (err) {
						callback(new Error("system error"));
						console.log(err)
						return res.json({
							code:'500',
							msg:'系统错误'
						})
					}
					total=result[0].total;
					callback(null,total);
				});
			},
			function(total,callback){
				var page=req.body.page||1;
				var pageSize=req.body.pageSize||10;

				var sql=`select d.orderNo,d.userId,d.money,d.status,d.recharge_way,d.recharge_bonus,d.create_time,u.username,u.mobile from user_assets_detail d inner join users u on d.userId=u.userId where d.type=1 order by d.create_time desc limit `+ (page-1)*pageSize+`,`+pageSize; // type=1 只查询用户充值

				// console.log('total===',total,sql)
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
						list:result,
						totals:total,
						msg:'ok'
					})
				})
			},
		], function(err, results){
		    if (err) {
		   		console.log(err)
		    }else{
		   		console.log(results)
		    }
		});
	}
})



// 后台审核用户充值 后台审核用户充值 后台审核用户充值 后台审核用户充值
router.post('/admin/rechargeCheck',(req,res,next)=>{
	if (!req.body.orderNo||!req.body.userId ||req.body.status==undefined) {
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	async.waterfall([
		function(callback){
	    	var sql=`select * from user_assets_detail where orderNo='${req.body.orderNo}'`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					callback(new Error("system error"))
					console.log(err)
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				if (result.length==0) {
					callback(new Error("system error"))
					return res.json({
						code:'500',
						msg:'该记录不存在'
					})
				}else{
					callback(null,result[0])
				}
			})
	    },
		function(data,callback){
			if (req.body.status==2) {// amount_available
				var totalMoney=data.money+data.recharge_bonus // 充值金额加上赠送金额
				var updateSql = `update users set amount_available=amount_available+${totalMoney} where userId=${req.body.userId}`;
			}else{
				callback(null,'user recharge failed');//未收到用户转账 继续往下走
				return
			}

			db.connection.query(updateSql, (error, results) => {
				if (error) {
					console.log(error)
					callback(new Error("system error"));
					return res.json({
						code: '500',
						msg: '系统错误'
					})
				}
				callback(null,'user recharge successfully');
			})
		},

		function(data,callback){
			console.log('data====',data)
			var _where = {orderNo: req.body.orderNo};
		    if (req.body.status==2) {// 已收到用户转账
				var _set = {status: 2};
			}else{// 未收到用户转账
				var _set = {status: 3};
			}
		    
		    db.updateData('user_assets_detail', _set, _where, (err, result) => {
		        if (err) {
		            console.log(err)
		            callback(new Error("system error"));
		            return res.json({
		                code: '500',
		                msg: '系统错误'
		            })
		        }
		        callback(null,'Rider has received money');
		        res.json({
		            code: '200',
		            msg: 'ok'
		        })
		    })
		},
	], function(err, results){
	    if (err) {
	   		console.log('admin check riders apply error',err)
	    }else{
	   		console.log(results)
	    }
	});
})





// 用户问题反馈

router.post('/feedback',(req,res,next)=>{
	if (!req.body.userId|| !req.body.content) {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		// return
	}

	var saveDate={
		userId:req.body.userId,
		content:req.body.content,
		create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
	}
	db.insertData('feedback',saveDate,(err,result)=>{
		if (err) {
			console.log('error=====',err)
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
