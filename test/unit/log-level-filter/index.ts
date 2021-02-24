import assert from 'assert';
import { lorem } from 'faker';

import logLevelFilter from '../../../src/log-level-filter';

const [DEBUG, ERROR, WARN, LOG] = logLevelFilter.LOG_LEVEL;

describe('Log Level Filter', () => {
  context('level: debug', () => {
    it('returns true for every known output type', () => {
      const levelDebugCheck = (outputType: any) => logLevelFilter({ logLevel: DEBUG, outputType });

      assert.equal(logLevelFilter.LOG_LEVEL.every(levelDebugCheck), true);
    });

    it('returns false if a non-existant output type is requested', () => {
      assert.equal(logLevelFilter({ logLevel: DEBUG, outputType: lorem.word() }), false);
    });
  });

  context('level: error', () => {
    it('returns false when output type is debug', () => {
      assert.equal(logLevelFilter({ logLevel: ERROR, outputType: DEBUG }), false);
    });

    it('returns true for error output type', () => {
      const levelErrorCheck = (outputType: any) => logLevelFilter({ logLevel: ERROR, outputType });

      assert.equal([ERROR].every(levelErrorCheck), true);
    });
  });

  context('level: warn', () => {
    const levelWarnCheck = (outputType: any) => logLevelFilter({ logLevel: WARN, outputType });

    it('retuns false for debug and error output types', () => {
      assert.equal([DEBUG, ERROR].every(levelWarnCheck), false);
    });

    it('returns true for warn and info output types', () => {
      assert.equal([WARN, LOG].every(levelWarnCheck), true);
    });
  });

  context('level: info', () => {
    const levelInfoCheck = (outputType: any) => logLevelFilter({ logLevel: LOG, outputType });

    it('returns false for every type but info', () => {
      assert.equal([DEBUG, ERROR, WARN].every(levelInfoCheck), false);
    });

    it('returns true when info output type is requested', () => {
      assert.equal(logLevelFilter({ logLevel: LOG, outputType: LOG }), true);
    });
  });
});
