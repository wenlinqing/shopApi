var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../mysql/mysql.js');
var async = require("async");

router.post('/getDataList', function(req, res, next) {
	// console.log(req.session)

	var page=req.body.page||1;
	var pageSize=req.body.pageSize||10;
	var title=req.body.title||'';
	var sqlAll=`select count(1) as total from riders `;
	var total = '';
	if (title!='') {
		sqlAll+=` where riderName like ?`
		sqlAll = db.mysql.format(sqlAll, `%`+title+`%`);
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

		var sql=`select riderId,riderName,mobile,illegal_operations,total_income,amount_available,frozen_amount,withdrawal_account,create_time from riders `;
		if (title!='') {
			sql+=`where riderName like ? order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
			sql = db.mysql.format(sql, `%`+title+`%`);
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



// 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据 骑手个人中心数据
router.post('/incomeInfos',(req,res,next)=>{
	if (!req.body.riderId ) {
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	var sql=`
		select sum(income) as todayIncome from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().format('YYYY-MM-DD 00:00:00') + `' and '` + moment().format('YYYY-MM-DD 23:59:59') + `'; 
		select sum(income) as yestodayIncome from rider_income where riderId=${req.body.riderId} and  create_time between '` + moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
		select sum(income) as monthIncome from rider_income where riderId=${req.body.riderId} and create_time between '`
		+ moment().add(-1, 'month').format('YYYY-MM-01 00:00:00') + `' and '` + moment(moment().add(-1, 'month').format('YYYY-MM-01 00:00:00')).subtract(-1, 'month').add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `';
		select total_income,amount_available,frozen_amount from riders where riderId=${req.body.riderId}
		`;
	db.selectAll(sql,(err,result)=>{
		if (err) {
			console.log(err)
			return res.json({
				code:'500',
				msg:'系统错误'
			})
		}

		// [ [ { todayIncome: 20 } ],
		// [ { yestodayIncome: 26 } ],
		// [ { todayIncome: 26 } ] ]

		var dataObj={}
		for (var i = 0; i < result.length; i++) {
			var data=result[i]
			// console.log(data[0])
			Object.assign(dataObj,data[0])
		}
		for(var key in dataObj){
			console.log(key)
			if (dataObj[key]==null) {
				dataObj[key]=0
			}
		}
		// console.log('dataObj===',dataObj)
		res.json({
			code:'200',
			data:dataObj,
			msg:'ok'
		})
	})
})

// 统计骑手配送订单量 统计骑手配送订单量 统计骑手配送订单量 统计骑手配送订单量 统计骑手配送订单量 统计骑手配送订单量 统计骑手配送订单量
router.post('/orderCounts',(req,res,next)=>{
	if (!req.body.riderId ) {
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	var sql=`
		select count(*) as todayAmount from order_order where riderId=${req.body.riderId} and status=2 and create_time between '` + moment().format('YYYY-MM-DD 00:00:00') + `' and '` + moment().format('YYYY-MM-DD 23:59:59') + `'; 
		select count(*) as yestodayAmount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
		select count(*) as monthAmount from order_order where riderId=${req.body.riderId} and status=2 and create_time between '`
		+ moment().add(-1, 'month').format('YYYY-MM-01 00:00:00') + `' and '` + moment(moment().add(-1, 'month').format('YYYY-MM-01 00:00:00')).subtract(-1, 'month').add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `';
		select count(*) as successAmount from order_order where riderId=${req.body.riderId} and status=2;
		select count(*) as failAmount from order_order where riderId=${req.body.riderId} and status=4;
		select count(*) as totalAmount from order_order where riderId=${req.body.riderId} and (status=2 or status=4);
		`;
	db.selectAll(sql,(err,result)=>{
		if (err) {
			console.log(err)
			return res.json({
				code:'500',
				msg:'系统错误'
			})
		}
		var dataObj={}
		for (var i = 0; i < result.length; i++) {
			var data=result[i]
			// console.log(data[0])
			Object.assign(dataObj,data[0])
		}
		// console.log('dataObj===',dataObj)
		res.json({
			code:'200',
			data:dataObj,
			msg:'ok'
		})
	})
})


// 骑手近七天 配送量及收益数据  供echart展示 骑手近七天 配送量及收益数据  供echart展示 骑手近七天 配送量及收益数据  供echart展示
router.post('/7daysInfo',(req,res,next)=>{
	if (!req.body.riderId ) {// 100的整数倍才能提现
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	async.waterfall([
		function(callback){
			var sql=`
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-2, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-2, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-3, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-3, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-4, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-4, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-5, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-5, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-6, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-6, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select count(*) as amount from order_order where riderId=${req.body.riderId} and status=2 and  delive_time between '` + moment().add(-7, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-7, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					console.log(err)
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				var dataObj={
					name:'接单量',
					data:[]
				}
				var emptyAry=[]
				for (var i = 0; i < result.length; i++) {
					var data=result[i]
					// console.log(data[0])
					if (data[0].amount==null) {
						data[0].amount=0
					}
					emptyAry.unshift(data[0].amount)
				}
				dataObj.data=emptyAry
				// console.log('emptyAry===',emptyAry,'dataObj===',dataObj)
				callback(null,dataObj);
			})
		},
		function(amountData, callback){
			var resultData=[amountData]
			var sql=`
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-1, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-1, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-2, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-2, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-3, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-3, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-4, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-4, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-5, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-5, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-6, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-6, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				select sum(income) as amount from rider_income where riderId=${req.body.riderId} and create_time between '` + moment().add(-7, 'days').format('YYYY-MM-DD 00:00:00') + `' and '` + moment().add(-7, 'days').format('YYYY-MM-DD 23:59:59') + `'; 
				`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					console.log(err)
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				var dataObj={
					name:'日收益(￥)',
					data:[]
				}
				var emptyAry=[]
				for (var i = 0; i < result.length; i++) {
					var data=result[i]
					// console.log(data[0])
					if (data[0].amount==null) {
						data[0].amount=0
					}
					emptyAry.unshift(data[0].amount)
				}
				dataObj.data=emptyAry
				callback(null,dataObj);
				resultData.push(dataObj)
				// console.log('resultData===',resultData)
				res.json({
					code:'200',
					data:resultData,
					msg:'ok'
				})
				
			})
		}
	], function(err, results){
	    if (err) {
	   		console.log('rider error',err)
	    }else{
	   		console.log(results)
	    }
	});
		
})


// 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现 骑手 申请提现
router.post('/applyForWithdrawal',(req,res,next)=>{
	// console.log(!req.body.money||!req.body.riderId||(req.body.money%100 != 0))
	if (req.body.money==undefined||!req.body.riderId ) {// 100的整数倍才能提现
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	// return
	async.waterfall([
		function(callback){
			var sql=`select amount_available from riders where riderId=${req.body.riderId}`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					console.log(err)
					callback(new Error("system error"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				var available=result[0].amount_available
				// console.log('available=',available)
				if (available>=req.body.money) { // 可用金额 必须大于 提现申请金额
					callback(null,1);
				}else{
					callback(new Error("system error"));
					res.json({
						code:'500',
						msg:'提现金额不能超过可用金额'
					})
				}
			})
		},
		function(text,callback){
			var sql=`select withdrawalMoney from systems`;
			db.selectAll(sql,(err,result)=>{
				if (err) {
					console.log(err)
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				var withdrawalMoney=result[0].withdrawalMoney
				if ((req.body.money%withdrawalMoney == 0)) { // 去系统可提现金额 进行对比
					callback(null,1);
				}else{
					callback(new Error("system error"));
					res.json({
						code:'500',
						msg:'提现金额为 '+withdrawalMoney+'的整数倍'
					})
				}
			})
		},
		function(text, callback){// 提现申请成功
			// console.log('Withdrawal application amount===',req.body.money)
			var saveDate={
				riderId:req.body.riderId,
				money:req.body.money,
				create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
			}
			db.insertData('withdrawals_record',saveDate,(err,result)=>{
				if (err) {
					console.log('error=====',err)
					callback(new Error("Withdrawal application failed"));
					return res.json({
						code:'500',
						msg:'系统错误'
					})
				}
				callback(null,1);
			})
		},
		function(text, callback){// 冻结骑手可用资产
			// console.log('Rider amount_available will freeze===',req.body.money)
			var updateSql = `update riders set amount_available=amount_available-${req.body.money},frozen_amount=frozen_amount+${req.body.money} where riderId=${req.body.riderId}`;
			db.connection.query(updateSql, (error, results) => {
				if (error) {
					console.log(error)
					callback(new Error("system error"));
					return res.json({
						code: '500',
						msg: '系统错误'
					})
				}
				callback(null,'Withdrawal application successfully');
				res.json({
					code:'200',
					msg:'ok'
				})
			})
		}
	], function(err, results){
	   if (err) {
		console.log('rider applyForWithdrawal error',err)
	   }else{
		console.log(results)
	   }
	});
})

// 后台审核 骑手提现申请 后台审核 骑手提现申请 后台审核 骑手提现申请 后台审核 骑手提现申请 后台审核 骑手提现申请 后台审核 骑手提现申请
router.post('/admin/checkApply',(req,res,next)=>{
	if (req.body.money==undefined||!req.body.riderId ||req.body.status==undefined) {
		res.json({
			code:'504',
			msg:'参数错误'
		})
		return
	}
	async.waterfall([
		function(callback){
			if (req.body.status==2) {// 人工已转账 减掉冻结的转账金额
				var updateSql = `update riders set frozen_amount=frozen_amount-${req.body.money} where riderId=${req.body.riderId}`;
			}else{// 转账失败 申请的金额退回账户 
				var updateSql = `update riders set amount_available=amount_available+${req.body.money},frozen_amount=frozen_amount-${req.body.money} where riderId=${req.body.riderId}`;
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
				callback(null,'Withdrawal application successfully');
			})
		},
		function(data,callback){
			var _where = {id: req.body.id};
		    
		    if (req.body.status==2) {// 人工已转账
				var _set = {status: 2};
			}else{// 转账失败 
				var _set = {status: 3};
			}
		    
		    db.updateData('withdrawals_record', _set, _where, (err, result) => {
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

//骑手提现申请记录 骑手提现申请记录 骑手提现申请记录 骑手提现申请记录 骑手提现申请记录 骑手提现申请记录 骑手提现申请记录 骑手提现申请记录
router.post('/applyList',(req,res,next)=>{
	var types=req.headers['roletype'];
	if (types!='admin') {// 骑手自查
		if (!req.body.riderId) {
			res.json({
				code:'504',
				msg:'参数错误'
			})
			return
		}
		var sql = `select * from withdrawals_record where riderId=?`;
	    sql = db.mysql.format(sql,req.body.riderId);// 预防SQL注入
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
	            data: result,
	            msg: 'ok'
	        })
	    })
	}else{ // 后台查询

		async.waterfall([
			function(callback){
				var sqlAll=`select count(1) as total from withdrawals_record`;
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

				var sql=`select w.id,w.riderId,w.money,w.status,w.create_time,r.riderName,r.mobile,r.withdrawal_account from withdrawals_record w inner join riders r  on w.riderId=r.riderId order by w.create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;

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









module.exports = router;
