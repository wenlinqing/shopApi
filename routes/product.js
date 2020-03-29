var express = require('express');
var router = express.Router();
var moment = require('moment');
const fs=require('fs');
var db = require('../mysql/mysql.js');

// 上下架
router.post('/enabledProduct',(req,res,next)=>{
	let _where = {productId : req.body.productId};
    let _set = {isEnabled :req.body.isEnabled};
	db.updateData('products',_set,_where,(err,result)=>{
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

router.post('/getDataList', function(req, res, next) {
	var page=req.body.page||1;
	var pageSize=req.body.pageSize||10;
	var title=req.body.title||'';

	var types=req.headers['authorization'];
	if (types=='admin') {
		var sqlAll=`select count(1) as total from products `;
		var total = '';
		if (title!='') {
			sqlAll+=` where productName like ?`
			sqlAll = db.mysql.format(sqlAll, `%`+title+`%`);
		}
	}

	if (types=='web') {
		var sqlAll=`select count(1) as total from products where isEnabled=1 `;
		var total = '';
		if (title!='') {
			sqlAll+=` and productName like ?`;
			sqlAll = db.mysql.format(sqlAll, `%`+title+`%`);
		}
		// sqlAll+=` isEnabled=1`
	}
	// console.log('sqlAll',sqlAll)
	// console.log('types',types)
	db.selectAll(sqlAll,(err,result)=>{
		if (err) {
			console.log(err)
			return res.json({
				code:'500',
				msg:'系统错误'
			})
		}
		total=result[0].total;//统计数量

		if (total>0) {
			if (types=='admin') {
				var sql=`select * from products `;
				if (title!='') {
					sql+=` where productName like ?`
					sql = db.mysql.format(sql, `%`+title+`%`);
				}
				sql+=` order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
			}

			if (types=='web') {
				var sql=`select * from products where isEnabled=1 `;
				if (title!='') {
					sql+=` and productName like ?`
					sql = db.mysql.format(sql, `%`+title+`%`);
				}
				sql+=` order by create_time desc limit `+ (page-1)*pageSize+`,`+pageSize;
			}

			// console.log(sql)
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
		}else{
			res.json({
				code:'200',
				page:page,
				pageSize:pageSize,
				totals:0,
				list:[],
				msg:'ok'
			})
		}
	})

			
});



// 添加商品
router.post('/productAdd',(req,res,next)=>{
	var productId=(moment().format('YYYYMMDD')).toString() + Date.now().toString().substr(0,10)

	var saveDate={
		productId:productId,
		productImg:req.body.productImg,
		productName:req.body.productName,
        price:req.body.price,
        newComerPrice:req.body.newComerPrice,
        promotePrice:req.body.promotePrice,
        unit:req.body.unit,
        create_time:moment().format('YYYY-MM-DD HH:mm:ss'),
	}
	db.insertData('products',saveDate,(err,result)=>{
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

router.post('/productEdit',(req,res,next)=>{
    var _where = {productId : req.body.productId};
    var _set = {
    	productImg:req.body.productImg,
		productName:req.body.productName,
        price:req.body.price,
        newComerPrice:req.body.newComerPrice,
        promotePrice:req.body.promotePrice,
        unit:req.body.unit,
    };
	db.updateData('products',_set,_where,(err,result)=>{
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
