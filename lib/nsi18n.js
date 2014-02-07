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
var hasInited = false;
var locals = {};
exports.NSI18N = function() {
	if (!hasInited) {
		//查看文件夹是否存在，不存在则进行创建
		if (!fs.existsSync(opts.localsDir)) {
			utils.mkdirs(opts.localsDir);
		}
		//将所有的国际化文件读取到配置中
		readLocals();
		hasInited = true;
	}
	return function(req, res, next) {
		//获取参数，设置Local
		if (req.query && req.query.local) {
			setLocal(req, res, req.query.local);
		}
		//将render方法包裹为renderI18n
		res.iRender = function(view, options, fn) {
			var self = this;
			self.render(view, options, function(err, str) {
				if (err) self.req.next(err);
				str = _$(req, str);
				self.send(str);
			});
		}
		next();
	};
};
exports.config = function(options) {
	opts = utils.extends({}, opts, options);
};
var _$ = exports._$ = function(req, str) {
	var local = getLocal(req);
	if (!req) return '';
	if (str.match(tagReg)) {
		return str.replace(tagReg, function(found, $1) {
			if ($1) {
				return locals[local][$1] || locals[opts.defaultLocals][$1] || $1;
			}
		});
	} else {
		return locals[local][str] || locals[opts.defaultLocals][str] || str;
	}
};
var getLocal = exports.getLocal = function(req) {
	var local;
	if (req && req.local) {
		local = req.local;
	} else if (req && req.cookies && req.cookies[opts.cookieName]) {
		local = req.cookies[opts.cookieName];
	}
	if (!local || opts.locals.indexOf(local) < 0)
		local = opts.defaultLocals;
	return local;
};
var setLocal = exports.setLocal = function(req, res, local) {
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
		locals[local] = {};
		fileNames.forEach(function(name) {
			var reg = new RegExp(local + '$');
			if (path.basename(name, opts.ext).match(reg)) {
				locals[local] = require(path.join(opts.localsDir, name));
			}
		});
	});
};