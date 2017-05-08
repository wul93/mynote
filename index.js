var express = require('express');
var path = require('path')
var bodyParser = require('body-parser')
var crypto = require('crypto')
var session = require('express-session');
var checkLogin = require('./checkLogin.js');
var moment=require('moment');

//引入mongoose
var mongoose = require('mongoose');

//引入模型
var models = require('./models/models');

var User = models.User;
var Note = models.Note;

//使用mongoose连接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('erro', console.log.bind(console, '连接数据库失败！'));

//创建express实例
var app = express();

//定义EJS模板引擎和模板文件位置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

//建立session模型
app.use(session({
	secret: '1234',
	name: 'mynote',
	cookie: {maxAge: 1000*3600*24*7},
	resave: false,
	saveUninitialized: true
}));

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'wul',
    password: '123456',
    database:'notes'
});

//响应首页get请求
app.get('/', checkLogin.noLogin);
app.get('/', function (req, res) {
	var value = req.session.user[0].username;
	var query =  connection.query('SELECT * FROM note where author="'+value+'"', function (err, ret) {
		if (err) {
			console.log('err1 is:'+err);	
		}
  
		console.log(ret);
		
		res.render('index', {
            user: req.session.user[0].username,
            notes: ret,
            title: '首页'
        });	
	});
});
var Raccount = '账号';
var Rpasswd = '密码';
app.get('/register', function(req, res){
	console.log('注册！');
	res.render('register', {
		user: req.session.user,
		title: '注册',
		zhanghao: Raccount,
		mima: Rpasswd,
	});
});

//post请求
app.post('/register', function(req, res){
	//req.body可以获取到表单的每项数据
	var username = req.body.username,
		password = req.body.password,
		passwordRepeat = req.body.passwordRepeat;

	var regAccount = "/^[a-z]|[A-Z]|[0-9]|[_]{3,20}$/";

        //检查用户名是否存在
	if(!username.match(regAccount)){
        Raccount = "用户名只能是字母、数字，下划线的组合，长度3-20个字符";
        console.log("用户名只能是字母、数字，下划线的组合，长度3-20个字符");
        return res.redirect('/register');
    }
	
	//检查输入的用户名是否为空，使用trim去掉两端的空格
	if(username.trim().length == 0){
		console.log('用户名不能为空');
		return res.redirect('/register');
	}
	

	//检查输入的密码是否为空，使用trim去掉两端的空格
	if(password.trim().length ==0 || passwordRepeat.trim().length == 0){
		console.log('密码不能为空');
		return res.redirect('/register');
	}
	
	//检查密码是否一致
	if(password != passwordRepeat){
		console.log('两次输入的密码不一致！');
		return res.redirect('/register');
	}
	//如果密码的格式不符合要求
	if(!(password.match(/([0-9])+/) && password.match(/([A-Z])+/) && password.match(/[a-z]+/) && password.length>6 )){
		Rpasswd = "密码长度不能少于6，同时必须包含数字和大小写字母";
		console.log("密码长度不能少于6，同时必须包含数字和大小写字母");
		return res.redirect('/register');
	}

	//检查用户名是否已经存在，如果不存在，则保存该记录
	var  userAddSql = 'INSERT INTO user(username,passwd) VALUES(?,?)';
	var  userAddSql_Params = [username, password];
	//增 add
	connection.query(userAddSql,userAddSql_Params,function (err, result) {
        if(err){
			console.log('[INSERT ERROR] - ',err.message);
			return res.redirect('/register');
        }       
		console.log('注册成功');
			return res.redirect('/');
	});

});

var Laccount = '账号';
var Lpasswd = '密码';

app.get('/', checkLogin.forbidLog);
app.get('/login', function (req, res) {
    console.log('登陆！');
    res.render('login', {
        user: req.session.user,
        title: '登陆',
		zhanghao: Laccount,
		mima: Lpasswd
    });
});

app.post('/login', function(req, res){
	var username = req.body.username,
		password = req.body.password;
	
	var value = username;
    console.log(username);

	var query =  connection.query('SELECT * FROM user where username="'+value+'"', function (err, ret) {
		if (err) {
			console.log('err1 is:'+err);
			return res.redirect('/login');
		}
		if(password!==ret[0].passwd){
			console.log('密码错误！');
			return res.redirect('/login');			
		}
		console.log('登录成功');
		/* password=null;
		delete user.password; */
		req.session.user=ret;
		console.log(req.session.user);
		return res.redirect('/');
	});
});

app.get('/quit', function(req, res){
	req.session.user = null;
	console.log('退出！');
	return res.redirect('/login');
});

app.get('/post', function(req, res){
	console.log('发布！');
	res.render('post',{
		user: req.session.user,
		title: '发布'
	});
});

app.post('/post', function (req, res) {

    var note = new Note({
        title: req.body.title,
        author: req.session.user[0].username,
        tag: req.body.tag,
        content: req.body.content
    });
	var  userAddSql = 'INSERT INTO note(title,author,tag,content) VALUES(?,?,?,?)';
	var  userAddSql_Params = [note.title,note.author,note.tag,note.content];
	//增 add
	connection.query(userAddSql,userAddSql_Params,function (err, result) {
		if(err){
			console.log('[INSERT ERROR] - ',err.message);
			return res.redirect('/post');
        }       
       console.log('文章发表成功！');
        return res.redirect('/');
	});
});

app.get('/detail/:id', function (req, res) {
    console.log('查看笔记！');
	
	var value = req.params.id;
	var query =  connection.query('SELECT * FROM note where id="'+value+'"', function (err, ret) {
		if (err) {
			console.log('err1 is:'+err);
		}
		if(ret){
			res.render('detail',{
			title: '笔记详情',
            user: req.session.user[0].username,
            art:ret[0],
            moment:moment
			});
		}
	});
});

//监听3000端口
app.listen(3001, function(req, res){
	console.log('app is running at port 3000');
});
