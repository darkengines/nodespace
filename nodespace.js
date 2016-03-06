var path = require('path');
var fs = require('fs');
var async = require('async');

var instance = null;

var Nodespace = function () {
	this.modules = {};
};

Nodespace.prototype.registerModules = function (root, require, callback) {
	this.resolve(root, require, callback);
};

Nodespace.prototype.resolve = function (path, require, callback) {
	var that = this;
	resolveDir(path, that.modules, require, callback);
};

Nodespace.prototype.where = function (predicate, callback) {
	var result = [];
	if (callback) {
		whereAsync(this.modules, predicate, result, function () {
			callback(result);
		});
	} else {
		where(this.modules, predicate, result);
		return result;
	}
};

var where = function (node, predicate, result) {
	if (predicate(node)) result.push(node);
	var keys = Object.keys(node);
	keys.forEach(function (key) { where(node[key], predicate, result); });
};

var whereAsync = function (node, predicate, result, callback) {
	predicate(node, function (passed) {
		if (passed) result.push(node);
	});
	if (typeof node == 'object') {
		var keys = Object.keys(node);
		var tasks = keys.map(function (key) {
			return function (callback) {
				whereAsync(node[key], predicate, result, callback);
			};
		});
		async.parallel(tasks, callback);
	} else {
		callback();
	}
};

var resolveDir = function (dirPath, root, require, callback) {
	fs.readdir(dirPath, function (err, fileNames) {
		var tasks = async.reduce(fileNames, root,
			function (node, fileName, callback) {
			resolveFile(dirPath, fileName, node, require, function (err, node) {
				callback(err, node);
			});
		}, function (err, node) { callback(err, node); });
	});
};

var resolveFile = function (dirPath, fileName, root, require, callback) {
	filePath = dirPath + '/' + fileName;
	fs.lstat(filePath, function (err, stat) {
		if (stat.isFile() && path.extname(fileName) == '.js') {
			var name = fileName.substr(0, fileName.lastIndexOf('.js'));
			var module = require(filePath);
			root[name] = module;
			callback(err, root);
		} else if (stat.isDirectory()) {
			root[fileName] = {};
			resolveDir(filePath, root[fileName], require, callback);
		} else {
			callback(err, root);
		}
	});
};

module.exports = instance || new Nodespace();