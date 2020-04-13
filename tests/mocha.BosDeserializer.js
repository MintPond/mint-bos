'use strict';

const
    assert = require('assert'),
    bosDeserializer = require('../lib/service.bosDeserializer'),
    bosSerializer = require('../lib/service.bosSerializer');


describe('BosDeserializer', () => {

    describe('"validate" function result', () => {

        context('valid data', () => {

            let serialized;
            let allSerialized;

            before(() => {
                serialized = bosSerializer.serialize({
                    replyId: 1,
                    string: 'this is a string',
                    bytes: Buffer.alloc(2, 1),
                    array: ['string', 1, 2.2, false],
                    obj: {
                        str: 'str',
                        int: 2,
                        float: 2.3,
                        bool: true
                    }
                });
                const serialized2 = bosSerializer.serialize(['string', 1, 2.2, false]);
                allSerialized = Buffer.concat([serialized, serialized2]);
            });

            it('should validate from starting index 0', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0), true);
            });

            it('should validate starting from end of first serialized object data', () => {
                assert.strictEqual(bosDeserializer.validate(allSerialized, serialized.length), true);
            });

            it('should NOT validate if not starting at a data start boundary', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 3), false);
            });

            it('should validate if dataLen is equal to expected size', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0, serialized.length), true);
            });

            it('should NOT validate if dataLen is less than expected size', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0, serialized.length - 1), false);
            });

            it('should NOT validate if dataLen is greater than buffer length', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0, serialized.length + 1), false);
            });

            it('should NOT validate if dataLen is 0', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0, 0), false);
            });
        });

        context('incomplete data', () => {

            let serialized;

            before(() => {
                var complete = bosSerializer.serialize(['string', 1, 2.2, false]);
                serialized = Buffer.alloc(15);
                complete.copy(serialized, 0);
            });

            it('should NOT validate', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0), false);
            });
        });

        context('invalid data', () => {

            var serialized;

            before(() => {
                serialized = Buffer.from('this is a string');
            });

            it('should NOT validate', () => {
                assert.strictEqual(bosDeserializer.validate(serialized, 0), false);
            });
        });
    });

    describe('"deserialize" function result', () => {

        let serialized;
        let result;

        before(() => {
            serialized = bosSerializer.serialize({
                replyId: 1,
                bool: true,
                int8: -1,
                int16: -300,
                int32: -2147483640,
                uint8: 254,
                uint16: 4000,
                uint32: 4294967290,
                float: 5.5,
                string: 'this is a string',
                bytes: Buffer.alloc(2, 1),
                array: ['string', 1, 2.2, false],
                obj: {
                    str: 'str',
                    int: 2,
                    float: 2.3,
                    bool: true
                }
            });
            result = bosDeserializer.deserialize(serialized);
        });

        it('should return undefined if data is incomplete', () => {

            const incomplete = Buffer.alloc(serialized.length - 1);
            serialized.copy(incomplete, 0);

            const result = bosDeserializer.deserialize(incomplete);
            if (result !== undefined)
                assert.error('Incomplete buffer exception expected');
        });

        it ('should return undefined if data is larger than it should be', () => {
            serialized[0] -= 1;

            const result = bosDeserializer.deserialize(serialized);
            if (result !== undefined)
                assert.error('exception expected');
        });

        it('should be an object', () => {
            assert.strictEqual(typeof result, 'object');
        });

        it('with 13 keys', () => {
            assert.strictEqual(Object.keys(result).length, 13);
        });

        describe('"replyId" key', () => {

            it('should exist', () => {
                assert.strictEqual('replyId' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.replyId, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.replyId, 1);
            });
        });

        describe('"bool" key', () => {

            it('should exist', () => {
                assert.strictEqual('bool' in result, true);
            });

            it('should be a boolean', () => {
                assert.strictEqual(typeof result.bool, 'boolean');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.bool, true);
            });
        });

        describe('"int8" key', () => {

            it('should exist', () => {
                assert.strictEqual('int8' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.int8, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.int8, -1);
            });
        });

        describe('"int16" key', () => {

            it('should exist', () => {
                assert.strictEqual('int16' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.int16, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.int16, -300);
            });
        });

        describe('"int32" key', () => {

            it('should exist', () => {
                assert.strictEqual('int32' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.int32, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.int32, -2147483640);
            });
        });

        describe('"uint8" key', () => {

            it('should exist', () => {
                assert.strictEqual('uint8' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.uint8, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.uint8, 254);
            });
        });

        describe('"uint16" key', () => {

            it('should exist', () => {
                assert.strictEqual('uint16' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.uint16, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.uint16, 4000);
            });
        });

        describe('"uint32" key', () => {

            it('should exist', () => {
                assert.strictEqual('uint32' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.uint32, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.uint32, 4294967290);
            });
        });

        describe('"float" key', () => {

            it('should exist', () => {
                assert.strictEqual('float' in result, true);
            });

            it('should be a number', () => {
                assert.strictEqual(typeof result.float, 'number');
            });

            it('should have correct value', () => {
                assert.strictEqual(
                    Math.round(result.float * 10000000) / 10000000, 5.5);
            });
        });

        describe('"string" key', () => {

            it('should exist', () => {
                assert.strictEqual('string' in result, true);
            });

            it('should be a string', () => {
                assert.strictEqual(typeof result.string, 'string');
            });

            it('should have correct value', () => {
                assert.strictEqual(result.string, 'this is a string');
            });
        });

        describe('"bytes" key', () => {

            it('should exist', () => {
                assert.strictEqual('bytes' in result, true);
            });

            it('should be a Buffer', () => {
                assert.strictEqual(Buffer.isBuffer(result.bytes), true);
            });

            it('should have a length of 2', () => {
                assert.strictEqual(result.bytes.length, 2);
            });

            it('should have correct value', () => {
                assert.strictEqual(result.bytes[0], 1);
                assert.strictEqual(result.bytes[1], 1);
            });
        });

        describe('"array" key', () => {

            it('should exist', () => {
                assert.strictEqual('array' in result, true);
            });

            it('should be an Array', () => {
                assert.strictEqual(Array.isArray(result.array), true);
            });

            it('should have a length of 4', () => {
                assert.strictEqual(result.array.length, 4);
            });

            describe('array element 0', () => {
                it('should have correct value', () => {
                    assert.strictEqual(result.array[0], 'string');
                });
            });

            describe('array element 1', () => {
                it('should have correct value', () => {
                    assert.strictEqual(result.array[1], 1);
                });
            });

            describe('array element 2', () => {
                it('should have correct value', () => {
                    assert.strictEqual(
                        Math.round(result.array[2] * 10000000) / 10000000, 2.2);
                });
            });

            describe('array element 3', () => {
                it('should have correct value', () => {
                    assert.strictEqual(result.array[3], false);
                });
            });
        });

        describe('"obj" key', () => {

            it('should exist', () => {
                assert.strictEqual('obj' in result, true);
            });

            it('should be an object', () => {
                assert.strictEqual(typeof result.obj, 'object');
            });

            describe('obj "str" key', () => {

                it('should exist', () => {
                    assert.strictEqual('str' in result.obj, true);
                });

                it('should have correct value', () => {
                    assert.strictEqual(result.obj.str, 'str');
                });
            });

            describe('obj "int" key', () => {

                it('should exist', () => {
                    assert.strictEqual('int' in result.obj, true);
                });

                it('should have correct value', () => {
                    assert.strictEqual(result.obj.int, 2);
                });
            });

            describe('obj "float" key', () => {

                it('should exist', () => {
                    assert.strictEqual('float' in result.obj, true);
                });

                it('should have correct value', () => {
                    assert.strictEqual(
                        Math.round(result.obj.float * 10000000) / 10000000, 2.3);
                });
            });

            describe('obj "bool" key', () => {
                it('should exist', () => {
                    assert.strictEqual('bool' in result.obj, true);
                });
                it('should have correct value', () => {
                    assert.strictEqual(result.obj.bool, true);
                });
            });
        });
    });
});