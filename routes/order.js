var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../mysql/mysql.js');
var async = require("async");

// 后台 获取订单列表 后台 获取订单列表 后台 获取订单列表 后台 获取订单列表 后台 获取订单列表
router.post('/admin/getOrderList', function(req, res, next) {
	var page=req.body.page||1;
	var pageSize=req.body.pageSize||10;
	var orderNo=req.body.orderNo||'';
	var status=req.body.status||'';
	if (req.body.status==undefined) {// 不存在 中断 防止别人瞎搞
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}

	// console.log(req.body)
	var sqlAll=`select count(1) as total from order_order `;
	var total = '';
	if (orderNo!='') {
		sqlAll+=`  where orderNo=${orderNo}`
		if (status!='') {
			sqlAll+=`  and status=${status}`
		}
	}else if (orderNo=='') {
		if (status!='') {
			sqlAll+=` where status=${status}`
		}
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

		var sql=`select * from order_order `;
		if (orderNo!='') {
			sql+=`where orderNo=${orderNo}`;
			if (status!='') {
				sql+=` and status=${status}`;
			}
		}else if(orderNo==''){
			if (status!='') {
				sql+=` where status=${status}`;
			}
		}
		sql+=` order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
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



// 用户下单
router.post('/createOrder',(req,res,next)=>{
	var orderNo='No'+(moment().format('YYMMDD')).toString() + Date.now().toString().substr(0,12)
	if (!req.body.userId||req.body.userId=='') {
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
    async.waterfall([
	    function(callback){
	        // console.log(1111);
	        var sql=`select newcomer from users where userId=${req.body.userId}`
	        db.connection.query(sql, function (err,result) {
		        if (err) {
		            console.log('系统错误',err);
		            callback(new Error("system error"));
		            return res.json({
		                code:'500',
		                msg:'系统错误'
		            })
		        }
		        var string0 = JSON.stringify(result);
		        var data0 = JSON.parse(string0)[0];//  [ { newcomer: 0 } ] 取第一条
		        // console.log('data0', data0 ,data0==undefined)
		        if(data0==undefined){
		        	callback(new Error("用户不存在"));
		        	return res.json({
		                code:'500',
		                msg:'用户不存在'
		            })
		        }else{
		        	callback(null,data0); //
		        }
		        
		    });
	    },
	    function(userdata, callback){ // 循环商品  取出价格
			var sql2=`select price,newComerPrice,promotePrice,isPromote from products where productId in(${req.body.productIds})`
	        // console.log(sql2)
	        db.connection.query(sql2, function (err,results) {
		        if (err) {
		            console.log('系统错误',err);
		            callback(new Error("system error"));
		            return res.json({
		                code:'500',
		                msg:'系统错误'
		            })
		        }
		        
		        var string1 = JSON.stringify(results);
		        var priceData = JSON.parse(string1);

		        priceData.push(userdata)
				// console.log( 'priceData',priceData )
		        callback(null,priceData);
		    });
			
	    },
	    function(priceData, callback){ //
	        var valAry=req.body.values;

	        var newcomer=priceData[priceData.length-1].newcomer
	        // console.log('newcomer====',newcomer)

	        for(var i = 0; i < valAry.length; i++) {
				valAry[i].unshift(orderNo)

				if (newcomer==1) {// 使用新人价
		        	valAry[i][2]=priceData[i].newComerPrice
		        }
		        if (newcomer==0&&priceData[i].isPromote==1) {// 使用促销价
		        	valAry[i][2]=priceData[i].promotePrice
		        }
		        if (newcomer==1&&priceData[i].isPromote==0) {// 使用原价
		        	valAry[i][2]=priceData[i].price
		        }
			}
			
			var _where = {userId : req.body.userId};
		    var _set = {
		    	newcomer:0
		    };
			db.updateData('users',_set,_where,(err1,result)=>{
				if (err1) {
					console.log(err1)
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
			})


			var sql = "INSERT INTO order_detail(`orderNo`,`productId`,`price`, `amount`) VALUES ?"; //批量插入数据
	        db.connection.query(sql, [valAry], function (err3, rows, fields) {
		        if (err3) {
		            console.log('系统错误',err);
		            callback(new Error("system error"));
		            return res.json({
		                code:'500',
		                msg:'系统错误'
		            })
		        }
		        callback(null,1);
		    });
	    },
	    function(txt, callback){ // 创建订单
		    var saveDate={
		        orderNo:orderNo,
		        userId:req.body.userId,
		        hopeSendTime:req.body.hopeSendTime,
		        remark:req.body.remark,
		        totalAmount:req.body.totalAmount,
		        totalPrice:req.body.totalPrice,

		        receiverName:req.body.receiverName,
		        receiverTel:req.body.receiverTel,
		        houseNumber:req.body.houseNumber,

		        province:req.body.province,
		        city:req.body.city,
		        district:req.body.district,
		        receiverStreet:req.body.receiverStreet,
		        lng:req.body.lng,
		        lat:req.body.lat,
		        payWay:req.body.payway,
		        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
		    }
	    	db.insertData('order_order',saveDate,(error,result)=>{
		        if (error) {
		            console.log('系统错误',error);
		            callback(new Error("system error"));
		            return res.json({
		                code:'500',
		                msg:'系统错误'
		            })
		        }
		        callback(null,'ok');
		    })
	    },
	    function(txt, callback){ // 更新商品总销量
		    var numAry=req.body.productCounts;
		    var idsAry=req.body.productIds;
		    for(var i = 0; i < numAry.length; i++) {
				var updateSql = `update products set amount=amount+${numAry[i]},soldAmount=soldAmount-${numAry[i]} where productId=${idsAry[i]}`;
			    // console.log(numAry[i],idsAry[i],)
			    db.connection.query(updateSql, (error, results) => {
			        if (error) {
			            console.log(error)
			            callback(new Error("system error"));
			            return res.json({
			                code: '500',
			                msg: '系统错误'
			            })
			        }
			    })
			}
			callback(null,'oks');
	    },
	    function(txt,callback){
	    	if (req.body.payway==1) {// 用户余额支付 账户需减去总金额
	    		var updateSql = `update users set amount_available=amount_available-${req.body.totalPrice},used_amount=used_amount+${req.body.totalPrice} where userId=${req.body.userId}`;
			    db.connection.query(updateSql, (error, results) => {
			        if (error) {
			            console.log(error)
			            callback(new Error("system error"));
			            return res.json({
			                code: '500',
			                msg: '系统错误'
			            })
			        }
			        res.json({
						code:'200',
						msg:'ok'
					})
			        callback(null,'create order ok');
			    })
	    	}else{
	    		res.json({
					code:'200',
					msg:'ok'
				})
	    		callback(null,'create order ok');
	    	}
				
	    }
	], function(err, results){
	    if (err) {
		   console.log('err err err',err);
	    }else{
			console.log('results',results);
	    }
	});
})


// 骑手 按状态 查询订单 骑手 按状态 查询订单 骑手 按状态 查询订单 骑手 按状态 查询订单
router.post('/riderOrder',(req,res,next)=>{
	var riderId=req.body.riderId;
	var orderTag=req.body.orderTag;
	var actionList=[0,1,2,3,4]
	// console.log(req.body.orderTag,typeof(req.body.orderTag),actionList.indexOf(orderTag)==-1)
	if (actionList.indexOf(orderTag)==-1||riderId=='') {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		// return
	}
	
	//订单状态 0待送货 1送货中 2成功 3用户取消 4骑手取消(用户不要了)
	if (orderTag==0) {// 待配送
		var sql=`select * from order_order where status=0`;
	}else if (orderTag==1) {// 配送中
		var sql=`select * from order_order where riderId=? and status=1  order by create_time desc`;
		sql = db.mysql.format(sql, riderId);
	}else if (orderTag==2) {// 配送成功
		var sql=`select * from order_order where riderId=? and status=2  order by create_time desc`;
		sql = db.mysql.format(sql, riderId);
	}else{
		var sql=`select * from order_order where riderId=? and (status=3 or status=4)  order by create_time desc`;
		sql = db.mysql.format(sql, riderId);
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


//////////////////////////////////////////////////////////////////////////////////////////////

// 骑手对订单操作 骑手对订单操作 骑手对订单操作 骑手对订单操作 骑手对订单操作
router.post('/rider/orderAction',(req,res,next)=>{
	var action=req.body.actions
	var obj=req.body.items||'';
	var actionList=[1,2,4]
	if (!req.body.riderId||actionList.indexOf(action)==-1||req.body.orderNo=='') {// 不存在 中断 防止别人瞎搞
		return res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}

	
	async.waterfall([
		function(callback){// 判断该订单是否 完成  防止刷单
	        var sql=`select status,isDelive from order_order where orderNo='${req.body.orderNo}'`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				// console.log('result[0].isDelive=',result[0].isDelive)
				var status=result[0].status
				var isDelive=result[0].isDelive
				if (status==0) {// 待接单
					callback(null,'ok');
				}else if (status==1&&isDelive==0&&(action==2||action==4)) {// 订单还没完成  继续往下走
					callback(null,'ok');
				}else{// 订单已完成  记录被人恶搞次数
					var updateSql = `update riders set illegal_operations=illegal_operations+1 where riderId=${req.body.riderId}`;
				    db.connection.query(updateSql, (error, results) => {
				        if (error) {
				            console.log(error)
				            callback(new Error("system error"));
				            return res.json({
				                code: '500',
				                msg: '系统错误'
				            })
				        }
				        // console.log('请勿非法操作，否则收益将冻结')
				        callback(new Error("Do not operate illegally"));
				        return res.json({
							code:'500',
							msg:'请勿非法操作，否则收益将冻结'
						})
				    })
				    callback(new Error("Do not operate illegally"));
			        return res.json({
						code:'500',
						msg:'该订单已失效'
					})
				}
			})
	    },
	    function(ok,callback){
	    	console.log('rider start receive order')
	    	if (action==1) {// 骑手接单
				var _where = {orderNo : req.body.orderNo};
			    var _set = {
			    	riderId:req.body.riderId,
					riderName:req.body.riderName,
			        riderPhone:req.body.riderPhone,
			        status:1,
			        reveive_time:moment().format('YYYY-MM-DD HH:mm:ss')
			    };
			}
			if (action==2) {//骑手送达
				var _where = {orderNo : req.body.orderNo};
			    var _set = {
			        status:2,
			        isDelive:1,
			        delive_time:moment().format('YYYY-MM-DD HH:mm:ss')
			    };
			}
			if (action==4) {//用户不要了  骑手取消订单
				var _where = {orderNo : req.body.orderNo};
			    var _set = {
			        status:4,
			        isDelive:1,
			        delive_time:moment().format('YYYY-MM-DD HH:mm:ss')
			    };
			}

	        db.updateData('order_order',_set,_where,(err,result)=>{
				if (err) {
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				
				if (action==1) {
					// callback(new Error("Rider just received or cancelled"));
					res.json({
						code:'200',
						msg:'ok'
					})
				}
				if (action==4) {// 用户不要了   骑手取消订单  用户金额退回账户
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
						res.json({
							code:'200',
							msg:'ok'
						})
						callback(new Error("Rider cancelled"));
					})
				}
				if (action==2) {// 配送成功  接下来记录用户消费情况 和 分配骑手收益
					var saveDate={
			    		orderNo:'No'+(moment().format('YYMMDD')).toString() + Date.now().toString().substr(0,12),
						userId:req.body.userId,
						money:obj.totalPrice,// 消费金额
						remark:'购物消费',
						type:2,// 1 充值  2消费
						status:2,// 充值：1待审核 2成功  3失败
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
					})
				}
			})
	    },
	    function(actions, callback){
	    	// console.log('rider actions=',actions)
	        // 骑手送达  即 交易成功
        	var sql=`select deliveryFee from systems`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				// console.log('deliveryFee=',result[0])
				var deliveryFee=result[0].deliveryFee
				callback(null,deliveryFee);
			})
	    },
	    function(deliveryFee, callback){
			var saveDate={
				orderNo:req.body.orderNo,
				userId:req.body.userId,
		        riderId:req.body.riderId,
		        income:deliveryFee,
		        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
			}
			db.insertData('rider_income',saveDate,(err,result)=>{
				if (err) {
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				callback(null,deliveryFee);
			})
	    },
	    function(deliveryFee, callback){
			var updateSql = `update riders set total_income=total_income+${deliveryFee},amount_available=amount_available+${deliveryFee} where riderId=${req.body.riderId}`;
		    db.connection.query(updateSql, (error, results) => {
		        if (error) {
		            console.log(error)
		            callback(new Error("system error"));
		            return res.json({
		                code: '500',
		                msg: '系统错误'
		            })
		        }
		        console.log('Order transaction completed')
		        callback(null,'Order transaction completed');
		        res.json({
					code:'200',
					msg:'ok'
				})
		    })
	    },
	], function(err, results){
	   if (err) {
	   	console.log('rider delive error',err)
	   }else{
	   	console.log(results)
	   }
	});

})


/*router.post('/allTasks',(req,res,next)=>{
	var sql=`select * from order_order where status=0`;
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
})*/

module.exports = router;
