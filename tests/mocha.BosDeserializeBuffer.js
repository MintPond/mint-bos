'use strict';

const
    assert = require('assert'),
    BosDeserializeBuffer = require('../lib/class.BosDeserializeBuffer');


describe('BosDeserializeBuffer', () => {

    let dBuffer;

    beforeEach(() => {
        dBuffer = new BosDeserializeBuffer(12);
    });

    describe('"length" property', () => {

        it('should initialize to 0', () => {
            assert.strictEqual(dBuffer.length, 0);
        });

        it('should show correct length after append', () => {
            dBuffer.append(Buffer.alloc(5));
            dBuffer.append(Buffer.alloc(2));
            assert.strictEqual(dBuffer.length, 7);
        });
    });

    describe('"nextReadLength" property', () => {

        it('should initialize to 0', () => {
            assert.strictEqual(dBuffer.nextReadLength, 0);
        });

        it('should show correct length after append', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00]));
            dBuffer.append(Buffer.from([/* 1 byte Null */0x00]));
            assert.strictEqual(dBuffer.nextReadLength, 5);
        });
    });

    describe('"append" function', () => {

        it('should append full Buffer passed into it when no additional arguments are provided', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            assert.strictEqual(dBuffer.length, 5);

            var internalBuffer = dBuffer.toBuffer();

            assert.strictEqual(internalBuffer.length, 5);
            assert.strictEqual(internalBuffer[0], 0x05);
            assert.strictEqual(internalBuffer[1], 0x00);
            assert.strictEqual(internalBuffer[2], 0x00);
            assert.strictEqual(internalBuffer[3], 0x00);
            assert.strictEqual(internalBuffer[4], 0x00);

            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));

            internalBuffer = dBuffer.toBuffer();

            assert.strictEqual(internalBuffer.length, 10);
            assert.strictEqual(internalBuffer[0], 0x05);
            assert.strictEqual(internalBuffer[1], 0x00);
            assert.strictEqual(internalBuffer[2], 0x00);
            assert.strictEqual(internalBuffer[3], 0x00);
            assert.strictEqual(internalBuffer[4], 0x00);
            assert.strictEqual(internalBuffer[5], 0x05);
            assert.strictEqual(internalBuffer[6], 0x00);
            assert.strictEqual(internalBuffer[7], 0x00);
            assert.strictEqual(internalBuffer[8], 0x00);
            assert.strictEqual(internalBuffer[9], 0x00);
        });

        it('should append partial Buffer from start argument provided', () => {

            dBuffer.append(
                Buffer.from([0x00, 0x00, /* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]),
                2);

            assert.strictEqual(dBuffer.length, 5);

            let internalBuffer = dBuffer.toBuffer();

            assert.strictEqual(internalBuffer.length, 5);
            assert.strictEqual(internalBuffer[0], 0x05);
            assert.strictEqual(internalBuffer[1], 0x00);
            assert.strictEqual(internalBuffer[2], 0x00);
            assert.strictEqual(internalBuffer[3], 0x00);
            assert.strictEqual(internalBuffer[4], 0x00);
        });

        it('should append partial Buffer from start and to dataLen argument provided', () => {

            dBuffer.append(
                Buffer.from([/* filler */0x00, 0x00, /* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, /* filler */0x00, 0x00]),
                2, 7);

            assert.strictEqual(dBuffer.length, 5);

            let internalBuffer = dBuffer.toBuffer();

            assert.strictEqual(internalBuffer.length, 5);
            assert.strictEqual(internalBuffer[0], 0x05);
            assert.strictEqual(internalBuffer[1], 0x00);
            assert.strictEqual(internalBuffer[2], 0x00);
            assert.strictEqual(internalBuffer[3], 0x00);
            assert.strictEqual(internalBuffer[4], 0x00);
        });
    });

    describe('"deserialize" function', () => {

        it('should cause buffer to be empty after deserializing complete data', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.deserialize([]);
            assert.strictEqual(dBuffer.length, 0);
        });

        it('should leave behind any incomplete data after deserializing (1)', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, 0x09, 0x00]));
            dBuffer.deserialize([]);
            assert.strictEqual(dBuffer.length, 2);
        });

        it('should leave behind any incomplete data after deserializing (2)', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00, 0x09, 0x07]));
            dBuffer.deserialize([]);

            const internalBuffer = dBuffer.toBuffer();

            assert.strictEqual(internalBuffer[0], 0x09);
            assert.strictEqual(internalBuffer[1], 0x07);
        });

        it('should place deserialized object into output array (1)', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            const outputArray = [];
            dBuffer.deserialize(outputArray);
            assert.strictEqual(outputArray.length, 1);
            assert.strictEqual(outputArray[0], null);
        });

        it('should place deserialized object into output array (2)', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            dBuffer.deserialize(outputArray);
            assert.strictEqual(outputArray.length, 1);
            assert.strictEqual(outputArray[0], true);
        });

        it('should return number of deserialized objects', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.strictEqual(totalDeserialized, 2);
        });

        it('should return number of deserialized objects (1)', () => {
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.strictEqual(totalDeserialized, 0);
        });

        it('should return number of deserialized objects (2)', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x06, 0x00, 0x00, 0x00, /* 1 byte Bool */0x01, /* 1 byte value */0x01]));
            const outputArray = [];
            var totalDeserialized = dBuffer.deserialize(outputArray);
            assert.strictEqual(totalDeserialized, 2);
        });
    });

    describe('"clear" function', () => {

        it('should cause length property to return 0', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.clear();
            assert.strictEqual(dBuffer.length, 0);
        });

        it('should cause toBuffer to return empty Buffer', () => {
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.clear();
            const internalBuffer = dBuffer.toBuffer();
            assert.strictEqual(internalBuffer.length, 0);
        });
    });

    context('internal buffer expansion', () => {

        it('should expand as needed', () => {
            /* starting with a buffer of 12 bytes, increase to handle 15 bytes */
            assert.strictEqual(dBuffer.capacity, 12);

            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            dBuffer.append(Buffer.from([/* 4 bytes size */0x05, 0x00, 0x00, 0x00, /* 1 byte Null */0x00]));
            const internalBuffer = dBuffer.toBuffer();
            assert.strictEqual(internalBuffer.length, 15);

            assert.strictEqual(internalBuffer[0], 0x05);
            assert.strictEqual(internalBuffer[1], 0x00);
            assert.strictEqual(internalBuffer[2], 0x00);
            assert.strictEqual(internalBuffer[3], 0x00);
            assert.strictEqual(internalBuffer[4], 0x00);

            assert.strictEqual(internalBuffer[5], 0x05);
            assert.strictEqual(internalBuffer[6], 0x00);
            assert.strictEqual(internalBuffer[7], 0x00);
            assert.strictEqual(internalBuffer[8], 0x00);
            assert.strictEqual(internalBuffer[9], 0x00);

            assert.strictEqual(internalBuffer[10], 0x05);
            assert.strictEqual(internalBuffer[11], 0x00);
            assert.strictEqual(internalBuffer[12], 0x00);
            assert.strictEqual(internalBuffer[13], 0x00);
            assert.strictEqual(internalBuffer[14], 0x00);
        });
    });
});