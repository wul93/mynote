var mongoose =require("mongoose");
var Schema=mongoose.Schema;       //shecma就是如何定义数据的结构，在mongoose中，schema用JSON object作为定义

var userSchema =new Schema({
    username:String,               //其中，username,password,email.creteTime均为userSchena的属性
    password:String,
    email:String,
    createTime:{
        type:Date,
        default:Date.now
    }
});

var noteSchema =new Schema({
    title:String,
    author:String,
    tag:String,
    content:String,
    createTime:{
        type:Date,
        default:Date.now
    }
});

exports.Note=mongoose.model('Note',noteSchema);
exports.User=mongoose.model('User',userSchema);  //schema打包生成model,其中'User'为model的名字
                                                //这样,model会生成所有的document的update,add,read,save 方法

/*
1)Schema ： 一种以文件形式存储的数据库模型骨架，不具备数据库的操作能力

Model ： 由Schema发布生成的模型，具有抽象属性和行为的数据库操作对

Entity ： 由Model创建的实体，他的操作也会影响数据库

2) Schema、Model、Entity的关系请牢记，Schema生成Model，Model创造Entity，
   Model和Entity都可对数据库操作造成影响，但Model比Entity更具操作性

3）什么是Schema？
 我理解Schema仅仅只是一断代码，他书写完成后程序依然无法使用，更无法通往数据库端
 他仅仅只是数据库模型在程序片段中的一种表现，或者是数据属性模型
    */