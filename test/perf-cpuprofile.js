
var PassThrough = require('stream').PassThrough;
var perfCpuprofile = require('../');
var Lines = perfCpuprofile.Lines;
var Samples = perfCpuprofile.Samples;
var Accumulator = perfCpuprofile.Accumulator;

describe('Lines', function () {
	it('should split the input stream into lines', function (done) {
		var input = new PassThrough();
		var lines = new Lines();
		input.pipe(lines);
		input.push('one partial ');
		input.push('line\nand a second one');
		input.push(null);
		toArray(lines, function (arr) {
			arr.should.eql([
				'one partial line\n',
				'and a second one'
			]);
			done();
		});
	});
});

describe('Samples', function () {
	it('should ignore comments', function (done) {
		var input = new PassThrough({objectMode: true});
		var samples = new Samples();
		input.pipe(samples);
		input.push('# one comment\n');
		input.push(null);
		toArray(samples, function (arr) {
			arr.should.eql([]);
			done();
		});
	});
	it('should extract a sample', function (done) {
		var input = new PassThrough({objectMode: true});
		var samples = new Samples();
		input.pipe(samples);
		input.push('a-header 123456 cycles:\n');
		input.push('	00deadbeef functionname (libfoo.so.0.0)');
		input.push(null);
		toArray(samples, function (arr) {
			arr.should.eql([[{
				function: 'functionname',
				object: 'libfoo.so.0.0',
				address: '00deadbeef'
			}]]);
			done();
		});
	});
	it('should handle separate samples by a newline', function (done) {
		var input = new PassThrough({objectMode: true});
		var samples = new Samples();
		input.pipe(samples);
		input.push('a-header 123456 cycles:\n');
		input.push('	00deadbeef subcall (libfoo.so.0.0)\n');
		input.push('	00deadbeef functionname (libfoo.so.0.0)\n');
		input.push('\n');
		input.push('a-header 123456 cycles:\n');
		input.push('	00deadbeef2 functionname2 (libbar.so.0.0)\n');
		input.push(null);
		toArray(samples, function (arr) {
			arr.should.eql([[{
				function: 'subcall',
				object: 'libfoo.so.0.0',
				address: '00deadbeef'
			}, {
				function: 'functionname',
				object: 'libfoo.so.0.0',
				address: '00deadbeef'
			}], [{
				function: 'functionname2',
				object: 'libbar.so.0.0',
				address: '00deadbeef2'
			}]]);
			done();
		});
	});
});

describe('Accumulator', function () {
	it('should create a sample tree', function (done) {
		var input = new PassThrough({objectMode: true});
		var accumulator = new Accumulator();
		input.pipe(accumulator);
		input.push([{
				function: 'subcall',
				object: 'libfoo.so.0.0',
				address: '00deadbeef'
			}, {
				function: 'functionname',
				object: 'libfoo.so.0.0',
				address: '00deadbeef'
			}]);
		input.push(null);
		toArray(accumulator, function (arr) {
			var out = example();
			arr.should.eql([out]);
			done();
		});
	});
	it('should increment the hitcount for equal stackframes', function (done) {
		var input = new PassThrough({objectMode: true});
		var accumulator = new Accumulator();
		input.pipe(accumulator);
		var frame = [{
			function: 'subcall',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}, {
			function: 'functionname',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}];
		input.push(frame);
		input.push(frame);
		input.push(null);
		toArray(accumulator, function (arr) {
			var out = example();
			out.endTime = 0.002;
			out.samples.push(3);
			out.head.children[0].children[0].hitCount = 2;
			arr.should.eql([out]);
			done();
		});
	});
	it('should give equal functions the same callUID', function (done) {
		var input = new PassThrough({objectMode: true});
		var accumulator = new Accumulator();
		input.pipe(accumulator);
		var frame = [{
			function: 'subcall',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}, {
			function: 'functionname',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}];
		input.push(frame);
		var frame2 = [frame[0], {
			function: 'otherfunction',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}];
		input.push(frame2);
		input.push(null);
		toArray(accumulator, function (arr) {
			var out = example();
			out.endTime = 0.002;
			out.samples.push(5);
			out.head.children.push(exampleSumtree);
			arr.should.eql([out]);
			done();
		});
	});
	it('should use the address if the function name is `[unknown]`', function (done) {
		var input = new PassThrough({objectMode: true});
		var accumulator = new Accumulator();
		input.pipe(accumulator);
		var frame = [{
			function: 'subcall',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}, {
			function: 'functionname',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}];
		input.push(frame);
		var frame2 = [{
			function: '[unknown]',
			object: 'libfoo.so.0.0',
			address: '00deadbeef'
		}, frame[1]];
		input.push(frame2);
		input.push(null);
		toArray(accumulator, function (arr) {
			var out = example();
			out.endTime = 0.002;
			out.samples.push(4);
			out.head.children[0].children.push(exampleUnknown);
			arr.should.eql([out]);
			done();
		});
	});
});

describe('perfCpuprofile', function () {
	it('should put all the pieces together', function (done) {
		var input = new PassThrough();
		input.push('# a comment\n\n');
		input.push('a-header 123456 cycles:\n');
		input.push('	00deadbeef subcall (libfoo.so.0.0)\n');
		input.push('	00deadbeef functionname (libfoo.so.0.0)');
		input.push(null);
		perfCpuprofile(input, function (profile) {
			profile.should.eql(exampleOut);
			done();
		});
	});
});

var exampleOut = {
  "samples": [
    3
  ],
  "startTime": 0,
  "endTime": 0.001,
  "head": {
    "id": 1,
    "callUID": 0,
    "hitCount": 0,
    "lineNumber": 0,
    "url": "",
    "functionName": "(root)",
    "children": [
      {
        "id": 2,
        "callUID": 1,
        "hitCount": 0,
        "lineNumber": 0,
        "url": "libfoo.so.0.0",
        "functionName": "functionname",
        "children": [
          {
            "id": 3,
            "callUID": 2,
            "hitCount": 1,
            "lineNumber": 0,
            "url": "libfoo.so.0.0",
            "functionName": "subcall",
            "children": []
          }
        ]
      }
    ]
  }
};
var exampleSumtree = {
  "id": 4,
  "callUID": 3,
  "hitCount": 0,
  "lineNumber": 0,
  "url": "libfoo.so.0.0",
  "functionName": "otherfunction",
  "children": [
    {
      "id": 5,
      "callUID": 2,
      "hitCount": 1,
      "lineNumber": 0,
      "url": "libfoo.so.0.0",
      "functionName": "subcall",
      "children": []
    }
  ]
};
var exampleUnknown = {
  "id": 4,
  "callUID": 3,
  "hitCount": 1,
  "lineNumber": 0,
  "url": "libfoo.so.0.0",
  "functionName": "00deadbeef",
  "children": []
};


// just make a copy
function example() {
	return JSON.parse(JSON.stringify(exampleOut));
}

function toArray(stream, callback) {
	var arr = [];
	function tryRead() {
		var read;
		while ((read = stream.read())) {
			arr.push(read);
		}
		stream.once('readable', tryRead);
	}
	stream.once('end', function () {
		callback(arr);
	});
	tryRead();
}
