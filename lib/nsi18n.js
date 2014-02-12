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
var tagReg = new RegExp('\{\{([a-zA-Z0-9\_]+)\}\}(\\\(([^\{\}\(\)]+)\\\))?', 'gim');
var paramsReg = new RegExp('\{(\\\d)\}', 'gim');
var initialized = false;
var locals = new utils.LocalsCache();
exports.NSI18N = function() {
	// hasn't been initialized
	if (!initialized) {
		//if the local directory is not existed, create it
		if (!fs.existsSync(opts.localsDir)) {
			utils.mkdirs(opts.localsDir);
		}
		readLocals();
		initialized = true;
	}
	return function(req, res, next) {
		//if the request parameters contains 'local', set the current local
		if (req.query && req.query.local) {
			setLocal(res, req.query.local);
		}
		//add a new function 'iRender' to Response object with the old 'render' function, just replace the local tags.
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
//major function for getting compiled character string
var _$ = exports._$ = function(res, str, parameters) {
	if (!res || !str) return '';
	if (str.match(tagReg)) {
		return getCompiledTagFromHtml.apply(this, arguments);
	} else {
		return getCompiledTagFromStr.apply(this, arguments);
	}
};
//get the compiled string with given html characters
var getCompiledTagFromHtml = function(res, str) {
	var local = getLocal(res);
	return str.replace(tagReg, function(match, tag, _, sParams) {
		if (tag) {
			var result = locals.getLocalString(local, tag) || locals.getLocalString(opts.defaultLocals, tag) || tag;
			if (sParams) {
				return getCompiledParams(result, sParams.split(','));
			}
			return result;
		}
	});
};
//get the compiled string with given characters
var getCompiledTagFromStr = function(res, str, parameters) {
	var local = getLocal(res);
	var result = locals.getLocalString(local, str) || locals.getLocalString(opts.defaultLocals, str) || str;
	if (parameters) {
		var params = [];
		for (var pos = 2, size = arguments.length; pos < size; pos++) {
			params.push(arguments[pos]);
		}
		return getCompiledParams(result, params);
	}
	return result;
};
//compile parameters
var getCompiledParams = function(str, params) {
	return str.replace(paramsReg, function(match, index) {
		return params[index];
	});
};
//get the current local
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
//set the current local
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
//read all the local files into the cache
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