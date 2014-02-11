var utils = require('./utils');
var path = require('path');
var fs = require('fs');
var opts = {
	locals: ['zh_cn', 'en'],
	defaultLocals: 'en',
	cookieName: 'local',
	ext: '.js',
	localsDir: path.join(__dirname, '..', 'locals')
};
var tagReg = new RegExp('\{\{([a-zA-Z0-9\_]+)\}\}', 'gim');
var inited = false;
var locals = new utils.LocalsCache();
exports.NSI18N = function() {
	//是否已经初始化
	if (!inited) {
		//查看文件夹是否存在，不存在则进行创建
		if (!fs.existsSync(opts.localsDir)) {
			utils.mkdirs(opts.localsDir);
		}
		//将所有的国际化文件读取到配置中
		readLocals();
		inited = true;
	}
	return function(req, res, next) {
		//获取参数，设置Local
		if (req.query && req.query.local) {
			setLocal(res, req.query.local);
		}
		//将render方法包裹为renderI18n
		res.iRender = function(view, options, fn) {
			var self = this;
			self.render(view, options, function(err, str) {
				if (err) self.req.next(err);
				str = _$(res, str);
				self.send(str);
			});
		}
		next();
	};
};
exports.config = function(options) {
	opts = utils.extends({}, opts, options);
};
var _$ = exports._$ = function(res, str) {
	if (!res) return '';
	var local = getLocal(res);
	if (str.match(tagReg)) {
		return str.replace(tagReg, function(found, $1) {
			if ($1) {
				return locals.getLocalString(local, $1) || locals.getLocalString(opts.defaultLocals, $1) || $1;
			}
		});
	} else {
		return locals.getLocalString(local, str) || locals.getLocalString(opts.defaultLocals, str) || str;
	}
};
var getLocal = exports.getLocal = function(res) {
	var local;
	var req = res.req;
	if (req && req.local) {
		local = req.local;
	} else if (req && req.cookies && req.cookies[opts.cookieName]) {
		local = req.cookies[opts.cookieName];
	}
	if (!local || opts.locals.indexOf(local) < 0)
		local = opts.defaultLocals;
	return local;
};
var setLocal = exports.setLocal = function(res, local) {
	var req = res.req;
	if (res && res.cookie) {
		res.cookie(opts.cookieName, local, {
			maxAge: 1000 * 60 * 60 * 24 * 365
		});
		req.local = local;
		return local;
	}
	return opts.defaultLocals;
};
//读取所有的国际化文件
var readLocals = function() {
	var fileNames = fs.readdirSync(opts.localsDir);
	opts.locals.forEach(function(local) {
		fileNames.forEach(function(name) {
			var reg = new RegExp(local + '$');
			if (path.basename(name, opts.ext).match(reg)) {
				locals.setLocal(local, require(path.join(opts.localsDir, name)));
			}
		});
	});
};