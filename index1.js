//加载依赖库
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');

var mongoose = require('mongoose');  //mongoose 是nodejs中mongoldb驱动
var models = require('./models/models')

var moment = require('moment');

var checkLogin=require('./checkLogin.js');

var User = models.User;
var Note = models.Note;

//使用mongoose 连接服务
mongoose.connect('mongodb://localhost:27017/notes');   //notes为数据库
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));

var str1="账号";
var str2="密码";
var str3="账号";
var str4="密码";
//创建express 实例
var app = express();

//设置模板目录
app.set('views', path.join(__dirname, 'views'));  //  app.set(name, value)，第一个参数为name,第二个参数为具体值

//设置模板引擎
app.set('view engine', 'ejs');
/*
 “app.set('view engine', 'ejs');”
 也可以变成 “app.engine('.html', ejs.__express); 用ejs模板引擎来处理“.html”后缀的文件
 app.set('view engine', 'html');”
 */

/*
 ejs的特性：
 1）缓存功能，能够缓存已经解析好的html模板；
 2）利用<%- include filename %>加载其他页面模版；
 3）<% code %>用于执行其中javascript代码；
 4）<%= code %>会对code进行html转义；
 5）<%- code %>将不会进行转义；
 */


//定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
//__dirname的值为 e:\2016_application\NodeJS\myNote


//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//建立session模型,当用户登录成功后，需要将用户信息存入到session中
app.use(session({
    secret: '1234',
    name: 'mynote',
    cookie: {maxAge: 1000 * 60 * 20},  //设置session的保持时间为20分钟
    resave: false,
    saveUninitialized: true
}));
//响应首页get请求

app.get('/',checkLogin.noLogin);
//app.get('/register',checkLogin.forbid);
//app.get('/login',checkLogin.forbid);

//response.render方法，加载模板引擎和对应的视图文件，之后渲染成普通的HTML文档
app.get('/', function (req, res) {
    Note.find({author: req.session.user.username}).exec(function (err, allNotes) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        console.log( req.session.user.username);
        res.render('index', {
            user: req.session.user,
            notes: allNotes,
            title: '首页'
        });
    })
});


app.get('/register', function (req, res) {
    console.log('注册！');
    res.render('register', {
        user: req.session.user,
        title: '注册',
        zhanghao: str1,
        mima:str2
    });
});

app.post('/register', function (req, res) {
//req.body 可以获取到表单的每项数据
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;
    var regEx1="/^[a-z]|[A-Z]|[0-9]|[_]{3,20}$/";
    if(!username.match(regEx1)){
       str1 = "用户名只能是字母、数字，下划线的组合，长度3-20个字符";
        console.log("用户名只能是字母、数字，下划线的组合，长度3-20个字符");
        return res.redirect('/register');
    }

    if(!(password.match(/([0-9])+/) && password.match(/([A-Z])+/)  && password.match(/([a-z])+/) && password.length>6 )) {
        str2="密码长度不能少于6，必须同时包含数字、大/小写字母";
        console.log("密码长度不能少于6，必须同时包含数字、大/小写字母");
        return res.redirect('/register');
    }
    //检查输入的用户名是否为空，使用trim去掉两端空格
    if (username.trim().length == 0) {
        console.log("用户名不能为空!");
        return res.redirect('/register');
    }

//检查输入的密码是否为空，使用trim去掉两端空格
    if (password.trim().length == 0 || passwordRepeat.trim().length == 0) {
        str2="用户的密码不能为空！";
        console.log("用户的密码不能为空！");
        return res.redirect('/register');
    }
    //检查两次输入的密码是否一致
    if (password != passwordRepeat) {
        str2="两次输入的密码不一致";
        console.log("两次输入的密码不一致！");
        return res.redirect('/register');
    }

    //检查用户名是否已经存在，如果不存在，则保持该条记录
    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/register');
        }

        if (user) {
            console.log('用户已经存在')
            return res.redirect('/register');
        }

        //对密码进行md5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        //新建user对象用于保存数据
        var newUser = new User({
            username: username,
            password: md5password
        });

        newUser.save(function (err, doc) {
            if (err) {
                console.log(err);
                return res.redirect('/register');
            }
            console.log('注册成功!');
            return res.redirect('/login');
        });

    });
});
app.get('/login', function (req, res) {
    console.log('登陆！');
    res.render('login', {
        user: req.session.user,
        title: '登陆',
        zhanghao: str3,
        mima:str4
    });
});

app.post('/login', function (req, res) {
    var username = req.body.username,
        password = req.body.password;

    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/login');
        }

        if (!user) {
            console.log('用户不存在！');
            str3="用户不存在！";
            return res.redirect('/login');
        }

        //对密码进行md5加密
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');

        if (user.password !== md5password) {
            console.log('密码错误！');
            str4="密码错误！";
            return res.redirect('/login');
        }

        console.log('登陆成功！');
        user.password = null;
        delete user.password;  //为了安全起见，将密码删除
        req.session.user = user;
        //req.session是一个JSON格式的JavaScript对象，我们可以在使用的过程中随意的增加成员
        return res.redirect('/');
    });
});

app.get('/quit', function (req, res) {
    console.log('退出！');
    req.session.user = null;
    return res.redirect('/login');
});

app.get('/post', function (req, res) {
    console.log('发布！');
    res.render('post', {
        user: req.session.user,
        title: '发布'
    });
});

app.post('/post', function (req, res) {

    var note = new Note({
        title: req.body.title,
        author: req.session.user.username,
        tag: req.body.tag,
        content: req.body.content
    });

    note.save(function (err, doc) {
        if (err) {
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表成功！');
        return res.redirect('/');
    });
});


app.get('/detail/:_id', function (req, res) {
    console.log('查看笔记！');
    Note.findOne({_id: req.params._id}).exec(function (err,art) {
       if(err){
           console.log(err);
           return res.redirect('/');
       }
        if(art){
            res.render('detail',{
                title: '笔记详情',
                user: req.session.user,
            art:art,
            moment:moment
            });
        }
    });

});

//监听3000端口
app.listen(3000, function (req, res) {
    console.log('app is running at port 3000');
});
