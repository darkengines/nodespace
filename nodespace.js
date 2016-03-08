var path = require('path');
var fs = require('fs');
var async = require('async');
var graph = require('./graph.js');

var modules = [];

var Nodespace = function () {

};

Nodespace.prototype.initialize = function (path, require, callback) {
	var that = this;
	resolveDir(path, path, require, function (err) {
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
	var tasks = sortedModules.map(function (module) {
		return function (callback) {
			var name = module.name;
			var names = name.split('.');
			var nodespace = that;
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
				module.initialize.call(module, that, callback);
			} else {
				callback();
			}
		};
	});
	async.series(tasks, callback);
};

var resolveDir = function (dirPath, rootDir, require, callback) {
	fs.readdir(dirPath, function (err, fileNames) {
		async.each(fileNames, function (fileName, callback) {
			resolveFile(dirPath, rootDir, fileName, require, callback);
		}, callback);
	});
};

var resolveFile = function (dirPath, rootDir, fileName, require, callback) {
	var filePath = dirPath+'/'+fileName;
	fs.lstat(filePath, function (err, stat) {
		if (stat.isDirectory()) {
			resolveDir(filePath, rootDir, require, callback);
		} else {
			if (stat.isFile()) {
				if (path.extname(fileName) == '.js') {
					var name = fileName.substr(0, fileName.lastIndexOf('.js'));
					require(filePath);
				}
			}
			callback(err);
		}
	});
};

module.exports = new Nodespace();