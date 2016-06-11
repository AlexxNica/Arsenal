'use strict'; // eslint-disable-line strict

const assert = require('assert');

const checkRequestExpiry =
    require('../../../../lib/auth/v2/checkRequestExpiry');
const DummyRequestLogger = require('../../helpers').DummyRequestLogger;

const log = new DummyRequestLogger();

describe('checkTimestamp for timecheck in header auth', () => {
    it('should return true if the date in the header is ' +
       'more than 15 minutes old', () => {
        const timestamp = new Date(Date.now() - 16 * 60000);
        assert(checkRequestExpiry(timestamp, log));
    });

    it('should return true if the date in the header is more ' +
       'than 15 minutes in the future', () => {
        const timestamp = new Date(Date.now() + 16 * 60000);
        assert(checkRequestExpiry(timestamp, log));
    });

    it('should return false if the date in the header is ' +
       'within 15 minutes of current time', () => {
        const timestamp = new Date();
        assert(!checkRequestExpiry(timestamp, log));
    });
});
