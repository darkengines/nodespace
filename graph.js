var Graph = function(nodes, edges) {
	this.nodes = nodes ? nodes : [];
	this.edges = edges ? edges : [];
};
Graph.load = function(items, edgeProvider) {
	var graph = new Graph();
	items.forEach(function(from) {
		graph.nodes.push(from);
		items.forEach(function(to) {
			if (to!=from && edgeProvider(from, to)) graph.edges.push({from: from, to: to});
		});
	});
	return graph;
};
Graph.prototype.topologicalSort = function() {
	var sortedNodes = [];
	var edges = this.edges.slice(0);
	var that = this;
	var nodesWithNoIncomingEdges = that.nodes.filter(function(node) {
		return !edges.some(function(edge) { return edge.to == node });
	});
	while (nodesWithNoIncomingEdges.length) {
		var currentNode = nodesWithNoIncomingEdges.pop();
		sortedNodes.push(currentNode);
		currentEdges = edges.filter(function(edge) { return edge.from = currentNode; });
		currentEdges.forEach(function(edge) {
			var index = edges.indexOf(edge);
			edges.splice(index, 1);
		});
		var children = currentEdges.map(function(edge) { return edge.to; });
		children.forEach(function(child) {
			if (!edges.some(function(edge) { return edge.to == child })) nodesWithNoIncomingEdges.splice(0, 0, child);
		});
	}
	if (edges.length) throw 'Graph has at least one cycle.';
	return sortedNodes;
};

module.exports = Graph;