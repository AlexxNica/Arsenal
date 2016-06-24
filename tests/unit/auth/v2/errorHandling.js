'use strict'; // eslint-disable-line strict

const assert = require('assert');

const errors = require('../../../../lib/errors');
const auth = require('../../../../lib/auth/auth');
const DummyRequestLogger = require('../../helpers').DummyRequestLogger;

auth.setAuthHandler(require('../../../../lib/auth/vault'));

const logger = new DummyRequestLogger();

describe('Error handling in checkAuth', () => {
    it('should return an error message if no ' +
       'such access key access key', done => {
        const date = new Date();
        const request = {
            method: 'GET',
            headers: {
                date,
                'host': 's3.amazonaws.com',
                'user-agent': 'curl/7.43.0',
                'accept': '*/*',
                'authorization': 'AWS brokenKey1:MJNF7AqNapSu32TlBOVkcAxj58c=',
            },
            url: '/bucket',
            query: {},
        };
        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.InvalidAccessKeyId);
            done();
        }, 's3', request.query);
    });

    it('should return an error message if no date header ' +
       'is provided with v2header auth check', done => {
        const request = {
            method: 'GET',
            headers: {
                'host': 's3.amazonaws.com',
                'user-agent': 'curl/7.43.0',
                'accept': '*/*',
                'authorization': 'AWS accessKey1:MJNF7AqNapSu32TlBOVkcAxj58c=',
            },
            url: '/bucket',
        };

        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.MissingSecurityHeader);
            done();
        }, 's3', request.query);
    });

    it('should return an error message if the Expires ' +
       'query parameter is more than 15 minutes ' +
       'old with query auth check', done => {
        const request = {
            method: 'GET',
            url: '/bucket?AWSAccessKeyId=accessKey1&' +
                'Expires=1141889120&Signature=' +
                'vjbyPxybdZaNmGa%2ByT272YEAiv4%3D',
            query: {
                AWSAccessKeyId: 'accessKey1',
                Expires: '1141889120',
                Signature: 'vjbyPxybdZaNmGa%2ByT272YEAiv4%3D',
            },
            headers: {},
        };
        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.RequestTimeTooSkewed);
            done();
        }, 's3', request.query);
    });

    it('should return an error message if ' +
       'the signatures do not match for v2query auth', done => {
        // Date.now() provides milliseconds since 1/1/1970.
        // AWS Expires is in seconds so need to divide by 1000
        let expires = Date.now() / 1000;
        const fifteenMinutes = (15 * 60);
        expires = expires + fifteenMinutes;
        const request = {
            method: 'GET',
            url: '/bucket?AWSAccessKeyId=accessKey1&Expires' +
                `=${expires}&Signature=vjbyPxybdZaNmGa` +
                '%2ByT272YEAiv4%3D',
            query: {
                AWSAccessKeyId: 'accessKey1',
                Expires: expires,
                Signature: 'vjbyPxybdZaNmGa%2ByT272YEAiv4%3D',
            },
            headers: { host: 's3.amazonaws.com' },
        };
        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.SignatureDoesNotMatch);
            done();
        }, 's3', request.query);
    });

    it('should return an error message if the ' +
       'signatures do not match for v2header auth', done => {
        const date = new Date();
        const request = {
            method: 'GET',
            headers: {
                date,
                'host': 's3.amazonaws.com',
                'user-agent': 'curl/7.43.0',
                'accept': '*/*',
                'authorization': 'AWS accessKey1:MJNF7AqNapSu32TlBOVkcAxj58c=',
            },
            url: '/bucket',
            query: {},
        };
        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.SignatureDoesNotMatch);
            done();
        }, 's3', request.query);
    });

    it('should return an error message if accessKey is empty for' +
        'v2header auth', done => {
        const date = new Date();
        const request = {
            method: 'GET',
            headers: {
                date,
                'host': 's3.amazoneaws.com',
                'user-agent': 'curl/7.43.0',
                'accept': '*/*',
                'authorization': 'AWS :MJNF7AqNapSu32TlBOVkcAxj58c=',
            },
            url: '/bucket',
            query: {},
        };
        auth.doAuth(request, logger, err => {
            assert.deepStrictEqual(err, errors.MissingSecurityHeader);
            done();
        }, 's3', request.query);
    });
});

