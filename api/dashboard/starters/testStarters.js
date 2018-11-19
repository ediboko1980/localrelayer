import {
  exec,
} from 'child_process';

import {
  fgProcessLoggerWidget,
} from '../widgets';
import dashboardConfig from '../.config';


const fgProcessOutputHandler = (data) => {
  fgProcessLoggerWidget.insertBottom(data);
};

function testStarter(cb, testFilesPath) {
  const child = exec([
    'DASHBOARD_PARENT=true',
    `LOG_LEVEL=${dashboardConfig.fgProcessLogLevel}`,
    'NODE_ENV=test mocha',
    testFilesPath,
    '--require @babel/register',
    '--require module-alias/register',
    '--timeout 10000',
    '--colors',
    '--exit',
  ].join(' '));
  cb(child);
  child.stderr.on('data', fgProcessOutputHandler);
  child.stdout.on('data', fgProcessOutputHandler);
  return (ccb) => {
    child.kill('SIGINT');
    ccb();
  };
}

export const tests = [
  {
    id: 'apiServerCreateOrderTest',
    name: 'apiServer - postOrder test',
    type: 'test',

    run(cb) {
      return testStarter(
        cb,
        'apiServer/test/postOrder.test.js',
      );
    },
  }, {
    id: 'apiTests',
    name: 'apiServer - All tests',
    type: 'test',

    run(cb) {
      return testStarter(
        cb,
        'apiServer/test/*.test.js',
      );
    },
  },
];
