
exports = module.exports = perfCpuprofile;

var Reader = exports.Reader = require('./reader');
var Accumulator = exports.Accumulator = require('./accumulator');

function perfCpuprofile(input, callback) {
	var reader = new Reader(input);
	var accumulator = new Accumulator();
	reader.pipe(accumulator);

	tryRead();
	function tryRead() {
		var profile = accumulator.read();
		if (profile)
			return callback(profile);
		accumulator.once('readable', tryRead);
	}
}
