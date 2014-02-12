nsi18n
======
An I18N module for NodeJs with Express framework
Description
======
An I18N module for Nodejs with Express framework. It's easy to use. You can use js files or json files to record you local info.
Installation
======
    npm i nsi18n --save
Usage
======
```
var nsi18n = require('nsi18n');
var _$ = nsi18n._$;
nsi18n.config({
  locals: ['zh_cn', 'en'],
  defaultLocals: 'en',
  cookieName: 'local',
  ext: '.js',
  localsDir: path.join(__dirname, 'locals')
});

...

app.use(express.bodyParser());
app.use(express.cookieParser()); // this is important
app.use(nsi18n.NSI18N());
```
###Use with res.iRender
```
app.get('/', function(req, res, next) {
	res.iRender('index');
});
```
In jade file(or others, but not test) use "{{tag}}" to sign the local info
```
extends layout
block content
	h1 {{hello_world}}
	p {{welcome}}(thesadboy,thesadboy@qq.com)
```
###Use with _$
```
app.get('/', function(req, res, next) {
	res.send(_$(res,'hello_world'));
});
app.get('/count', function(req, res, next){
	res.send(_$(res,'welcome', 'thesadboy', 'thesadboy@qq.com'));
});
```
###Change the current local
Append a param "local" (eg. "local=en") to your url (eg. "http://localhost/?local=en") to change the current local.
Notice
======
###JS file demo(message_en.js)
```
module.exports = {
	hello_world : 'Hello World!',
	welcome : 'Welcome {0}, your email is {1}!'
}
```
###JSON file demo(message_en.json)
```
{
	"hello_world" : "Hello World"
	"welcome" : "Welcome {0}, your email is {1}!"
}
```
