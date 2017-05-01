function noLogin(req,res,next){
if(!req.session.user){
 console.log("抱歉，您还没有登录！");
return res.redirect('/login');
}
next();
}

function forbidLog(req,res,next){
	if(!req.session.user){
		console.log("抱歉，您已经登录，不能再进行登录操作！");
		return res.redirect('/');
	}
	next();
}




exports.forbidLog=forbidLog;
exports.noLogin=noLogin;