var express = require('express');
var router = express.Router();
var mysql = require('../mysql/conn');

//请求实时新闻
router.get('/', function (req, res) {
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
    mysql.query("SELECT * FROM news WHERE title LIKE '%" + val + "%'", (err, results) => {
        if (err) {
            console.log(err);
        } else {
            console.log(results);
            return res.send({data: results});
        }
    });
});

// 查询是否已收藏某新闻
router.post('/ishas', function (req, res) {
    mysql.query('select * from collect where mobile=? and news_id=?',
        [req.body.mobile, req.body.news_id], (err, result) => {
            console.log(result);
            if (result.length > 0) {
                res.send({success: true})
            } else {
                res.send({success: false})
            }
        })
})

// 查询个人的收藏
router.get('/my_coll/:mobile', function (req, res) {
    mysql.query('select * from collect c LEFT JOIN news n on n.news_id=c.news_id where mobile=?',
        req.params.mobile, (err, result) => {
            if (result.length > 0) {
                res.send({result: result});
            } else {
                res.send({result: false})
            }
        })
})

// 收藏某条新闻
router.post('/news', function (req, res) {
    mysql.query('insert into collect set ?', req.body, (err, result) => {
        err ? res.send({success: false}) : res.send({success: true});
    })
})
// 取消收藏某条新闻
router.post('/del_collect', function (req, res) {
    mysql.query('delete from collect where mobile=? and news_id=?',
        [req.body.mobile, req.body.news_id], (err, result) => {
            err ? res.send({success: false}) : res.send({success: true});
        })
})
// 新用户注册
router.post('/', function (req, res, next) {
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
    // 写入到 user 表
    mysql.query(`select * from login where username=?`, reg.username, (err, result) => {
        if (result[0]) {            // 检测用户名
            return res.send({result: 'nameExit'});
        } else {                    // 检测手机号码（主键）
            mysql.query(`select * from login where mobile=?`, reg.mobile, (err, result) => {
                if (result[0]) {
                    return res.send({result: 'mobileExit'});
                } else {
                    mysql.query(`insert into user set ?`, reg, (err) => {
                        if (err) {
                            console.log('user --> 失败')
                        } else {    // 写入到login
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
