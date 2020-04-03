const mysql = require('mysql');

class MysqlPool {
  constructor(){
    this.flag = true;
    this.pool = mysql.createPool({
        host:'localhost',
        // host:'120.78.72.112',
        user:'root',
        password:'123456',
        // password:'',
        database: 'database',
        charset: 'UTF8MB4_GENERAL_CI',
        multipleStatements: true //允许执行多条语句
    });
  }
  getPool(){
    if(this.flag){
      this.pool.on('connection', (connection)=>{
        connection.query('SET SESSION auto_increment_increment=1');
        this.flag = false;
      });
    }
    return this.pool;
  }  
}


module.exports = MysqlPool;