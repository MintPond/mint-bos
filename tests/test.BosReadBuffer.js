"use strict";

const
    assert = require('assert'),
    BosDeserializeBuffer = require('../lib/class.BosDeserializeBuffer');

describe('BosDeserializeBuffer', function () {

    var dBuffer;

    beforeEach(function () {
        dBuffer = new BosDeserializeBuffer(12);
    });

    describe('length property', function () {

        it('should initialize to 0', function () {
            assert.equal(dBuffer.length, 0);
        });

        it('should show correct length after append', function () {
            dBuffer.append(Buffer.alloc(5));
            dBuffer.append(Buffer.alloc(2));
            assert.equal(dBuffer.length, 7);
        });
    });

    describe('nextReadLength property', function () {

        it('should initialize to 0', function () {
            assert.equal(dBuffer.nextReadLength, 0);
        });

        it('should show correct length after append', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00]));
            dBuffer.append(Buffer.from([/* 1 byte Null */0x00]));
            assert.equal(dBuffer.nextReadLength, 5);
        });
    });

    describe('append function', function () {

        it('should append full Buffer passed into it when no additional arguments are provided', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            assert.equal(dBuffer.length, 5);

            var internalBuffer = dBuffer.toBuffer();

            assert.equal(internalBuffer.length, 5);
            assert.equal(internalBuffer[0], 0x05);
            assert.equal(internalBuffer[1], 0x00);
            assert.equal(internalBuffer[2], 0x00);
            assert.equal(internalBuffer[3], 0x00);
            assert.equal(internalBuffer[4], 0x00);

            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));

            internalBuffer = dBuffer.toBuffer();

            assert.equal(internalBuffer.length, 10);
            assert.equal(internalBuffer[0], 0x05);
            assert.equal(internalBuffer[1], 0x00);
            assert.equal(internalBuffer[2], 0x00);
            assert.equal(internalBuffer[3], 0x00);
            assert.equal(internalBuffer[4], 0x00);
            assert.equal(internalBuffer[5], 0x05);
            assert.equal(internalBuffer[6], 0x00);
            assert.equal(internalBuffer[7], 0x00);
            assert.equal(internalBuffer[8], 0x00);
            assert.equal(internalBuffer[9], 0x00);
        });

        it('should append partial Buffer from start argument provided', function () {

            dBuffer.append(
                Buffer.from([0x00, 0x00, /* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]),
                2);

            assert.equal(dBuffer.length, 5);

            var internalBuffer = dBuffer.toBuffer();

            assert.equal(internalBuffer.length, 5);
            assert.equal(internalBuffer[0], 0x05);
            assert.equal(internalBuffer[1], 0x00);
            assert.equal(internalBuffer[2], 0x00);
            assert.equal(internalBuffer[3], 0x00);
            assert.equal(internalBuffer[4], 0x00);
        });

        it('should append partial Buffer from start and to dataLen argument provided', function () {

            dBuffer.append(
                Buffer.from([/* filler */0x00, 0x00, /* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, /* filler */0x00, 0x00]),
                2, 7);

            assert.equal(dBuffer.length, 5);

            var internalBuffer = dBuffer.toBuffer();

            assert.equal(internalBuffer.length, 5);
            assert.equal(internalBuffer[0], 0x05);
            assert.equal(internalBuffer[1], 0x00);
            assert.equal(internalBuffer[2], 0x00);
            assert.equal(internalBuffer[3], 0x00);
            assert.equal(internalBuffer[4], 0x00);
        });
    });

    describe('deserialize function', function () {

        it('should cause buffer to be empty after deserializing complete data', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.deserialize([]);
            assert.equal(dBuffer.length, 0);
        });

        it('should leave behind any incomplete data after deserializing (1)', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, 0x09, 0x00]));
            dBuffer.deserialize([]);
            assert.equal(dBuffer.length, 2);
        });

        it('should leave behind any incomplete data after deserializing (2)', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, 0x09, 0x07]));
            dBuffer.deserialize([]);

            const internalBuffer = dBuffer.toBuffer();

            assert.equal(internalBuffer[0], 0x09);
            assert.equal(internalBuffer[1], 0x07);
        });

        it('should place deserialized object into output array (1)', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            const outputArray = [];
            dBuffer.deserialize(outputArray);
            assert.equal(outputArray.length, 1);
            assert.equal(outputArray[0], null);
        });

        it('should place deserialized object into output array (2)', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            dBuffer.deserialize(outputArray);
            assert.equal(outputArray.length, 1);
            assert.equal(outputArray[0], true);
        });

        it('should return number of deserialized objects', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.equal(totalDeserialized, 2);
        });

        it('should return number of deserialized objects (1)', function () {
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.equal(totalDeserialized, 0);
        });

        it('should return number of deserialized objects (2)', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.equal(totalDeserialized, 2);
        });
    });

    describe('clear function', function () {

        it('should cause length property to return 0', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.clear();
            assert.equal(dBuffer.length, 0);
        });

        it('should cause toBuffer to return empty Buffer', function () {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.clear();
            const internalBuffer = dBuffer.toBuffer();
            assert.equal(internalBuffer.length, 0);
        });
    });

    describe('internal buffer expansion', function () {

        it('should expand as needed', function () {
            /* starting with a buffer of 12 bytes, increase to handle 15 bytes */

            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            const internalBuffer = dBuffer.toBuffer();
            assert.equal(internalBuffer.length, 15);

            assert.equal(internalBuffer[0], 0x05);
            assert.equal(internalBuffer[1], 0x00);
            assert.equal(internalBuffer[2], 0x00);
            assert.equal(internalBuffer[3], 0x00);
            assert.equal(internalBuffer[4], 0x00);

            assert.equal(internalBuffer[5], 0x05);
            assert.equal(internalBuffer[6], 0x00);
            assert.equal(internalBuffer[7], 0x00);
            assert.equal(internalBuffer[8], 0x00);
            assert.equal(internalBuffer[9], 0x00);

            assert.equal(internalBuffer[10], 0x05);
            assert.equal(internalBuffer[11], 0x00);
            assert.equal(internalBuffer[12], 0x00);
            assert.equal(internalBuffer[13], 0x00);
            assert.equal(internalBuffer[14], 0x00);
        });
    });
});


