var path = require('path');
var fs = require('fs');
var async = require('async');
var graph = require('./graph.js');

var modules = [];

var Nodespace = function () {
	this.nodespace = {};
	this.exports = {};
};

Nodespace.prototype.initialize = function (path, require, callback) {
	var that = this;
	resolveDir(path, path, require, that.exports, function (err, exports) {
		if (err) throw err;
		initialize.call(that, function () { 
			callback(that)
		});
	});
};

Nodespace.prototype.register = function (moduleToRegister) {
	if (modules.some(function (module) {
		return module.name == moduleToRegister.name;
	})) {
		throw 'Nodespace name must be unique (' + moduleToRegister.name + ').';
	}
	modules.push(moduleToRegister);
};

var initialize = function (callback) {
	var that = this;
	var modulesGraph = graph.load(modules, function (from, to) {
		var names = to.nodespace.require;
		return names.indexOf(from.nodespace.name) >= 0;
	});
	var sortedModules = modulesGraph.topologicalSort();
	async.eachSeries(sortedModules, function (module, callback) {
		var name = module.name;
		var names = name.split('.');
		var nodespace = that.nodespace;
		var index = 0;
		var lastNameIndex = names.length - 1;
		while (index < lastNameIndex) {
			var currentName = names[index];
			if (!nodespace[currentName]) nodespace[currentName] = {};
			nodespace = nodespace[currentName];
			index++;
		}
		nodespace[names[index]] = module;
		if (module.initialize) {
			module.initialize.call(module, that.nodespace, that.exports, callback);
		} else {
			callback();
		}
	}, callback);
};

var resolveDir = function (dirPath, rootDir, require, exports, callback) {
	fs.readdir(dirPath, function (err, fileNames) {
		async.each(fileNames, function (fileName, callback) {
			resolveFile(dirPath, rootDir, fileName, require, exports, callback);
		}, callback);
	});
};

var resolveFile = function (dirPath, rootDir, fileName, require, exports, callback) {
	var filePath = dirPath+'/'+fileName;
	fs.lstat(filePath, function (err, stat) {
		if (stat.isDirectory()) {
			if (!exports[fileName]) exports[fileName] = {};
			resolveDir(filePath, rootDir, require, exports[fileName], callback);
		} else {
			if (stat.isFile()) {
				if (path.extname(fileName) == '.js') {
					var name = fileName.substr(0, fileName.lastIndexOf('.js'));
					exports[name] = require(filePath);
				}
			}
			callback(err);
		}
	});
};

module.exports = new Nodespace();