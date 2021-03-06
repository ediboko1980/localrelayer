export default {
  apiServer: {
    forkProcess: true,
    logLevel: 'silly',
  },
  socketServer: {
    forkProcess: true,
    logLevel: 'silly',
  },
  fillQueueHandler: {
    forkProcess: true,
    logLevel: 'silly',
  },
  orderWatcher: {
    forkProcess: true,
    logLevel: 'silly',
    ethNetworks: [
      'test',
      'kovan',
      'main',
    ],
  },
  sputnikSubscribe: {
    forkProcess: true,
    logLevel: 'silly',
    ethNetworks: [
      'test',
      'kovan',
      'main',
    ],
  },
  ganacheServer: {
    forkProcess: true,
    logLevel: 'silly',
  },
  defaultActiveProcesses: [
    'apiServer',
    'orderWatcher',
    'socketServer',
    'ganacheServer',
  ],
  fgProcessLogLevel: 'silly',
  nodemonDelay: 0,
  tmpFile: '/tmp/localrelayerDashboard',
};
