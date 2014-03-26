/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var Transform = require('stream').Transform;

module.exports = Lines;

// this is just the poor mans substitute for `lineno, line in enumerate(stream)`
// for the lack of generators, lets go the way of callback hell -_-
function Lines() {
	Transform.call(this, {objectMode: true});
	this._leftover = '';
}
Lines.prototype = Object.create(Transform.prototype);
Lines.prototype._transform = function Lines__transform(chunk, encoding, done) {
	var index;
	var lastIndex = 0;
	chunk = chunk.toString();
	while ((index = chunk.indexOf('\n', lastIndex)) !== -1) {
		this.push(this._leftover + chunk.slice(lastIndex, index + 1));
		if (!lastIndex) {
			this._leftover = '';
		}
		lastIndex = index + 1;
	}
	this._leftover = chunk.slice(lastIndex);
	done();
};
Lines.prototype._flush = function Lines__flush(done) {
	if (this._leftover)
		this.push(this._leftover);
	done();
};
