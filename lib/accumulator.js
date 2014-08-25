/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var Transform = require('stream').Transform;

module.exports = Accumulator;

function Accumulator() {
	Transform.call(this, {objectMode: true});
	this.sampleid = 0;
	this.head = new Sample(this, {function: '(root)'}, 0);
	this.samples = [];
	this.timestamps = [];
	this.uidMap = new Map();
	this.uids = 0;
	this.thread = null;
}
Accumulator.prototype = Object.create(Transform.prototype);
Accumulator.prototype._transform = function Accumulator__transform(sample, encoding, done) {
	var parent = this.head;
	if (!this.thread)
		this.thread = sample.thread_id;
	if (this.thread !== sample.thread_id)
		return done();
	// go from the bottom of the stack
	for (var i = sample.stack.length - 1; i >= 0; i--) {
		var child;
		var frame = sample.stack[i];
		var uid = this.getUID(frame);
		// and find any matching child
		for (var j = 0; j < parent.children.length; j++) {
			child = parent.children[j];
			if (child.callUID === uid)
				break;
		}
		//console.log(frame, parent.children, uid);
		var sampleF;
		if (j === parent.children.length) {
			// we didnt find a matching child, so create a new one
			sampleF = new Sample(this, frame, uid);
			parent.children.push(sampleF);
		}
		// the new parent is either the newly created sample,
		// or the matching child
		parent = sampleF || child;
	}
	// we reached or created th top of the stack, so push it to the samples
	parent.hitCount++;
	this.samples.push(parent.id);
	this.timestamps.push(sample.timestamp * 1e6);
	done();
};
Accumulator.prototype._flush = function Accumulator__flush(done) {
	this.push({
		samples: this.samples,
		timestamps: this.timestamps,
		startTime: this.timestamps[0] / 1e6,
		endTime: this.timestamps[this.timestamps.length - 1] / 1e6,
		head: this.head,
	});
	done();
};
Accumulator.prototype.getUID = function Accumulator_getUID(frame) {
	// uid based on address does not work that great.
	// use the symbol instead, since we are in C land, names are unique anyway
	var sym = symbol(frame);
	var uid = this.uidMap.get(sym);
	if (uid)
		return uid;
	this.uids++;
	this.uidMap.set(sym, this.uids);
	return this.uids;
};

function symbol(frame) {
	// in case we don’t have a symbol name, fall back to the address.
	var sym = frame.function;
	if (sym === '[unknown]')
		sym = frame.address;
	return sym;
}

function Sample(accumulator, frame, uid) {
	this.id = ++accumulator.sampleid;
	this.callUID = uid;
	this.hitCount = 0;
	this.lineNumber = 0;
	this.url = frame.object || '';
	this.functionName = symbol(frame) || '';
	this.children = [];
}
