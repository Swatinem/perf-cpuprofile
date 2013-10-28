
var Transform = require('stream').Transform;

module.exports = Accumulator;

function Accumulator() {
	Transform.call(this, {objectMode: true});
	this.head = new Sample({function: '(root)'}, 0);
	this.samples = [];
	this.uidMap = new Map();
	this.uids = 0;
}
Accumulator.prototype = Object.create(Transform.prototype);
Accumulator.prototype._transform = function Accumulator__transform(stack, encoding, done) {
	var parent = this.head;
	// go from the bottom of the stack
	for (var i = stack.length - 1; i >= 0; i--) {
		var frame = stack[i];
		var uid = this.getUID(frame);
		// and find any matching child
		for (var j = 0; j < parent.children.length; j++) {
			var child = parent.children[j];
			if (child.callUID == uid)
				break;
		}
		//console.log(frame, parent.children, uid);
		var sample;
		if (j == parent.children.length) {
			// we didnt find a matching child, so create a new one
			sample = new Sample(frame, uid);
			parent.children.push(sample);
		}
		// the new parent is either the newly created sample,
		// or the matching child
		parent = sample || child;
	}
	// we reached or created th top of the stack, so push it to the samples
	parent.hitCount++;
	this.samples.push(parent.id);
	done();
};
Accumulator.prototype._flush = function Accumulator__flush(done) {
	this.push({
		samples: this.samples,
		startTime: 0,
		endTime: this.samples.length / 1000,
		head: this.head,
	});
	done();
};
Accumulator.prototype.getUID = function Accumulator_getUID(frame) {
	// uid based on address does not work that great.
	// use the symbol instead, since we are in C land, names are unique anyway
	var symbol = Symbol(frame);
	var uid = this.uidMap.get(symbol);
	if (uid)
		return uid;
	this.uids++;
	this.uidMap.set(symbol, this.uids);
	return this.uids;
};

function Symbol(frame) {
	// in case we don’t have a symbol name, fall back to the address.
	var symbol = frame.function;
	if (symbol === '[unknown]')
		symbol = frame.address;
	return symbol;
}

var id = 0;
function Sample(frame, uid) {
	this.id = ++id;
	this.callUID = uid;
	this.hitCount = 0;
	this.lineNumber = 0;
	this.url = frame.object || '';
	this.functionName = Symbol(frame) || '';
	this.children = [];
}
