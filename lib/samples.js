/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var Transform = require('stream').Transform;

module.exports = Samples;

// {executable name} {pid} cycles:
var headerRegex = /(.+) (\d+) cycles:/;
// {address} {function name} ({shared object})
var stackRegex = /\s*([0-9a-f]+) (.+) \((.+)\)/;

function Samples() {
	Transform.call(this, {objectMode: true});
	this._currentSample = null;
}
Samples.prototype = Object.create(Transform.prototype);
Samples.prototype._transform = function Samples__transform(line, encoding, done) {
	if (line[0] === '#')
		return done(); // ignore comment lines
	if (this._currentSample) {
		if (line[0] === '\n' && this._currentSample) {
			this.push(this._currentSample);
			this._currentSample = null;
			return done();
		}
		var stack = line.match(stackRegex);
		this._currentSample.push({
			address: stack[1],
			function: stack[2],
			object: stack[3],
		});
		return done();
	}
	if (headerRegex.test(line))
		this._currentSample = [];
	done();
};
Samples.prototype._flush = function Samples__flush(done) {
	if (this._currentSample)
		this.push(this._currentSample);
	done();
};
