var express = require('express');
var router = express.Router();
var mysql = require('../mysql/conn');
var http = require('http');
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});
// 接收最新新闻，入库
router.post('/toutiao', function (req, res, next) {
    var news = req.body;
    for (var i = 0; i < news.length; i++) {
        var n = news[i];
        // console.log(n);
        try {
            mysql.query('insert into news SET ?', n, (err) => {
                console.log('成功!');
            })
        } catch (err) {
            return res.send({success: true});
        }
    }
    res.send({success: true})
});
//获取某类新闻
router.get('/getnews/:type', function (req, res, next) {
    let sql = 'select * from news where type=?';
    mysql.query(sql, req.params.type, (err, results) => {
        if (!err) {
            return res.send({data: results})
        } else {
            console.log(err);
        }
    })
});
//发表评论
router.post('/topic', function (req, res, next) {
    let sql = 'insert into topic set ?';
    mysql.query(sql, req.body, (err, result) => {
        if (!err) {
            let sql = 'update news set r_count=r_count+1 where news_id=?';
            mysql.query(sql, req.body.news_id, (err, result) => {
                if (!err) {
                    return res.send({
                        success: true
                    })
                } else {
                    console.log(err);
                }
            })
        } else {
            console.log(err);
        }
    })
});
//新闻观看次数+1
router.post('/view', function (req, res, next)  {
    let sql = 'update news set v_count=v_count+1 where news_id = ?';
    mysql.query(sql, req.body.id, (err, result) => {
        if (!err) {
            return res.send({
                success: true
            })
        } else {
            return res.send({
                success: false
            })
        }
    })
});
//评论回复数(热度)加1
router.post('/topic/add_rply', function (req, res, next) {
    let sql = 'update topic set rp_count=rp_count+1 where t_id=?';
    mysql.query(sql, req.body.id, (err, result) => {
        if (!err) {
            return res.send({
                success: true
            })
        } else {
            console.log(err);
        }
    })
});
//评论点赞
router.post('/topic/vote', function (req, res, next) {
    let sql = '';
    if (req.body.type) {
        sql = 'update topic set vote_up=vote_up+1 where t_id=?';
    } else {
        sql = 'update topic set vote_down=vote_down+1 where t_id=?';
    }
    mysql.query(sql, req.body.id, function (err, result) {
        if (!err) {
            return res.send({success: true})
        } else {
            console.log(err);
        }
    });

});
//获取某个新闻的评论
router.get('/topic/:news_id', function (req, res, next) {
    let sql = 'select * from topic where news_id=?';
    mysql.query(sql, req.params.news_id, (err, results) => {
        if (!err) {
            return res.send({data: results})
        } else {
            console.log(err);
        }
    })
});
//获取某个评论的所有子评论
router.get('/topic/children/:t_id', function (req, res, next) {
    let sql = 'select * from topic where t_to_t=?';
    mysql.query(sql, req.params.t_id, (err, results) => {
        if (!err) {
            return res.send({data: results});
        } else {
            console.log(err);
        }
    })
});
//获取视频
/// ************ huo qu jie xian*************
/// ************ shan shu shi pin guang gao*************
router.get('/video/:number', function (req, res) {
    var c = req.params.number;
    var options = {
        hostname: 'newapi.meipai.com',
        path: '/output/channels_topics_timeline.json?id=1&count=' + c,
        port: '80',
        method: 'GET'
    };
    var req2 = http.request(options, function (response) {
        let data = '';
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function (chunk) {
            res.type('application/json');
            res.send(data);
        });
    });
    req2.end();
});
module.exports = router;
