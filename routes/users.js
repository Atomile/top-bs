var express = require('express');
var router = express.Router();
var mysql = require('../mysql/conn');

//请求实时新闻
router.get('/', function (req, res) {
    console.log(1);

    // 请求 req
    // 相应 res
    mysql.query("SELECT * FROM news WHERE TYPE = 'junshi' OR TYPE = 'keji' OR " +
        "TYPE = 'caijing' ORDER BY news_id DESC LIMIT 17", (err, results) => {
        if (err) {
            console.log(err);
        } else {
            return res.send({data: results});
        }
    });
});

router.get('/page/:page', function (req, res) {
    let page = req.params.page;
    let size = 15;

    mysql.query("SELECT * FROM news WHERE TYPE = 'junshi' OR TYPE = 'keji' OR " +
        "TYPE = 'caijing' ORDER BY news_id DESC LIMIT ?,?", [page * size, size], (err, results) => {
        console.log(page * size, size)
        if (err) {
            console.log(err);
        } else {
            return res.send({data: results});
        }
    });
});

//根据关键字查找新闻
router.get('/:val', function (req, res) {
    var val = req.params.val;
    // 请求 req
    // 相应 res
    mysql.query("SELECT * FROM news WHERE title LIKE '%" + val + "%'", (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log(results);
            return res.send({data: results});
        }
    });
});

// 收藏某条新闻
router.post('/news', function (req, res) {
    mysql.query('insert into collect set ?', req.body, (err, result) => {
        err ? console.log(err.message) : res.send({success: true});
    })
})

// 新用户注册
router.post('/', function (req, res, next) {
    console.log(123);
    // 处理数据
    let reg = req.body;
    let login = {
        mobile: reg['mobile'],
        username: reg['username'],
        password: reg['password']
    };
    if (reg['secPwd']) {
        delete  reg['secPwd'];
    }
    reg['email'] = reg['email'].toLowerCase();
    delete reg['password'];
    console.log(reg['password'])
    // 写入到 user 表
    mysql.query(`select * from login where username=?`, reg.username, (err, result) => {
        if (result[0]) {          // 检测用户名
            // console.log(result[0],'该用户名已被注册');
            return res.send({result: 'nameExit'});
        } else {                  // 检测手机号码（主键）
            mysql.query(`select * from login where mobile=?`, reg.mobile, (err, result) => {
                if (result[0]) {
                    // console.log(result[0], '该手机号已被注册');
                    return res.send({result: 'mobileExit'});
                } else {
                    mysql.query(`insert into user set ?`, reg, (err) => {
                        if (err) {
                            // console.log('user --> 失败')
                        } else {       // 写入到login
                            mysql.query(`insert into login set ?`, login, (err) => {
                                err ? console.log('login --> 失败') : res.send({result: true});
                            })
                        }
                    });
                }
            });
        }
    })
});

// 用户登录
router.post('/login', function (req, res, next) {
    console.log(456);
    let user = req.body;
    mysql.query(`select u.*,l.password from login l,user u where u.username=?
                    and l.password=?`,
        [user.username, user.password], (err, result) => {
            try {
                if (result[0].password == user.password) {
                    res.send({result: result[0]});
                } else {
                    new Error();
                }
            } catch (err) {
                mysql.query(`select u.*,l.password from login l,user u where u.mobile=?
                    and l.password=?`, [user.username, user.password], (err, result) => {
                    try {
                        if (result[0].password == user.password) {
                            res.send({result: result[0]});
                        } else {
                            res.send({result: false});
                        }
                    } catch (err) {
                        res.send({result: false});
                    }
                })
            }
        });
});

// 用户找回密码
router.post('/find', function (req, res) {
    mysql.query('select * from user where mobile=? and email=?',
        [req.body.mobile, req.body.email], (err, result) => {
            try {
                if (result.length > 0) {
                    mysql.query('select * from login where mobile=?',
                        [req.body.mobile], (err, data) => {
                            if (data[0]) {
                                res.send({result: data[0]});
                            } else {
                                res.send({result: false});
                            }
                        });
                } else {
                    res.send({result: false});
                }
            } catch (err) {
                res.send({result: false});
            }
        });
})

// 用户修改密码
router.put('/revise', function (req, res) {
    let u = req.body;
    mysql.query('update login set password=? where mobile=?',
        [u.password, u.mobile], (err, result) => {
            try {
                if (result) {
                    console.log('ok');
                    res.send({result: true});
                }
            } catch (err) {
                res.send({result: false});
            }
        });
})

module.exports = router;
