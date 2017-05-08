/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var Transform = require('stream').Transform;

module.exports = Samples;

// {executable name} {pid} {time}: cycles:
var headerRegex = /(.+) (\d+(\/\d+)?) ([\d\.]+): +(\d+ )?cycles:/;
// {address} {function name} ({shared object})
var frameRegex = /\s*([0-9a-f]+) (.+) \((.+)\)/;

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
		var frame = line.match(frameRegex);
		if (frame) {
			this._currentSample.stack.push({
				address: frame[1],
				function: frame[2],
				object: frame[3],
			});
			return done();
		}
	}
	var header = line.match(headerRegex);
	if (header) {
		this._currentSample = {
			name: header[1],
			thread_id: header[2],
			timestamp: parseFloat(header[3]),
			stack: []
		};
	}
	done();
};
Samples.prototype._flush = function Samples__flush(done) {
	if (this._currentSample)
		this.push(this._currentSample);
	done();
};
