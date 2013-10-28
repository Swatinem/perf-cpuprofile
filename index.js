module.exports = process.env.PERF_CPUPROFILE_COV
  ? require('./lib-cov')
  : require('./lib');
