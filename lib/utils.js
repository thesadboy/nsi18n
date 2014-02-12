var fs = require('fs');
var path = require('path');
//merge objects
exports.extends = function() {
	var target = arguments[0] || {};
	for (var i = 1, length = arguments.length; i < length; i++) {
		var options = arguments[i] || {};
		for (var key in options) {
			target[key] = options[key];
		}
	}
	return target;
};
//copy file
exports.copyFileSync = function(srcpath, destpath, filename) {
	var buff = new Buffer(65536),
		pos = 0;
	if (!fs.existsSync(destpath)) fs.mkdirSync(destpath);
	var infd = fs.openSync(path.join(srcpath, filename), "r"),
		outfd = fs.openSync(path.join(destpath, filename), "w");
	do {
		var read = fs.readSync(infd, buff, 0, 65536, pos);
		pos += read;
		fs.writeSync(outfd, buff, 0, read);
	} while (read);
	fs.closeSync(infd);
	fs.closeSync(outfd);
};
//make directories one by one
var mkdirs = exports.mkdirs = function(dirpath, mode) {
	mode = mode || 0777;
	if (!fs.existsSync(dirpath)) {
		//try to create the parent directory, and then the current.
		mkdirs(path.dirname(dirpath), mode);
		fs.mkdirSync(dirpath, mode);
	}
}
//delete directories one by one
var rmdirs = exports.rmdirs = function(dirpath) {
	try {
		fs.readdirSync(dirpath).forEach(function(filepath) {
			var state = fs.statSync(path.join(dirpath, filepath));
			if (state.isDirectory()) {
				rmdirs(path.join(dirpath, filepath));
			} else {
				fs.unlinkSync(path.join(dirpath, filepath));
			}
		});
		fs.rmdirSync(dirpath);
	} catch (e) {}
}
//locals cache with buffer
exports.LocalsCache = function() {
	var self = this;
	var cache = {};
	this.setLocal = function(local, value) {
		cache[local] = new Buffer(JSON.stringify(value));
	};
	this.getLocal = function(local) {
		return cache[local] ? JSON.parse(cache[local].toString()) : {};
	};
	this.getLocalString = function(local, tag) {
		return self.getLocal(local)[tag];
	};
};