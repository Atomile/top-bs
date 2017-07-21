var mysql = require('mysql');
var conn = mysql.createConnection({
    host: '10.0.45.200',
    user: 'root',
    password: 'root',
    database: 'topnews'//数据库
});
conn.connect((err) => {
    if (err) {
        throw(err);
    } else {
        console.log('链接数据库成功!')
}
})
;
module.exports = conn;