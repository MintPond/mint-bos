"use strict";

const
    assert = require('assert'),
    bosDeserializer = require('../lib/service.bosDeserializer'),
    bosSerializer = require('../lib/service.bosSerializer');

describe('BosDeserializer', function () {

    describe('validate function result', function () {

        describe('valid data', function () {

            var serialized;
            var allSerialized;

            before(function () {
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

            it('should validate from starting index 0', function () {
                assert.equal(bosDeserializer.validate(serialized, 0), true);
            });

            it('should validate starting from end of first serialized object data', function () {
                assert.equal(bosDeserializer.validate(allSerialized, serialized.length), true);
            });

            it('should NOT validate if not starting at a data start boundary', function () {
                assert.equal(bosDeserializer.validate(serialized, 3), false);
            });

            it('should validate if dataLen is equal to expected size', function () {
                assert.equal(bosDeserializer.validate(serialized, 0, serialized.length), true);
            });

            it('should NOT validate if dataLen is less than expected size', function () {
                assert.equal(bosDeserializer.validate(serialized, 0, serialized.length - 1), false);
            });

            it('should NOT validate if dataLen is greater than buffer length', function () {
                assert.equal(bosDeserializer.validate(serialized, 0, serialized.length + 1), false);
            });

            it('should NOT validate if dataLen is 0', function () {
                assert.equal(bosDeserializer.validate(serialized, 0, 0), false);
            });
        });

        describe('incomplete data', function () {

            var serialized;

            before(function () {
                var complete = bosSerializer.serialize(['string', 1, 2.2, false]);
                serialized = Buffer.alloc(15);
                complete.copy(serialized, 0);
            });

            it('should NOT validate', function () {
                assert.equal(bosDeserializer.validate(serialized, 0), false);
            });
        });

        describe('invalid data', function () {

            var serialized;

            before(function () {
                serialized = Buffer.from('this is a string');
            });

            it('should NOT validate', function () {
                assert.equal(bosDeserializer.validate(serialized, 0), false);
            });
        });
    });

    describe('deserialize function result', function () {

        var result;

        before(function () {
            var serialized = bosSerializer.serialize({
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

        it('should be an object', function () {
            assert.equal(typeof result, 'object');
        });

        it('with 13 keys', function () {
            assert.equal(Object.keys(result).length, 13);
        });

        describe('"replyId" key', function () {
            it('should exist', function () {
                assert.equal('replyId' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.replyId, 'number');
            });
            it('should have correct value', function () {
                assert.equal(result.replyId, 1);
            });
        });

        describe('"bool" key', function () {
            it('should exist', function () {
                assert.equal('bool' in result, true);
            });
            it('should be a boolean', function () {
                assert.equal(typeof result.bool, 'boolean');
            });
            it('and have correct value', function () {
                assert.equal(result.bool, true);
            });
        });

        describe('"int8" key', function () {
            it('should exist', function () {
                assert.equal('int8' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.int8, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.int8, -1);
            });
        });

        describe('"int16" key', function () {
            it('should exist', function () {
                assert.equal('int16' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.int16, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.int16, -300);
            });
        });

        describe('"int32" key', function () {
            it('should exist', function () {
                assert.equal('int32' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.int32, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.int32, -2147483640);
            });
        });

        describe('"uint8" key', function () {
            it('should exist', function () {
                assert.equal('uint8' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.uint8, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.uint8, 254);
            });
        });

        describe('"uint16" key', function () {
            it('should exist', function () {
                assert.equal('uint16' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.uint16, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.uint16, 4000);
            });
        });

        describe('"uint32" key', function () {
            it('should exist', function () {
                assert.equal('uint32' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.uint32, 'number');
            });
            it('and have correct value', function () {
                assert.equal(result.uint32, 4294967290);
            });
        });

        describe('"float" key', function () {
            it('should exist', function () {
                assert.equal('float' in result, true);
            });
            it('should be a number', function () {
                assert.equal(typeof result.float, 'number');
            });
            it('and have correct value', function () {
                assert.equal(
                    Math.round(result.float * 10000000) / 10000000, 5.5);
            });
        });

        describe('"string" key', function () {
            it('should exist', function () {
                assert.equal('string' in result, true);
            });
            it('should be a string', function () {
                assert.equal(typeof result.string, 'string');
            });
            it('and have correct value', function () {
                assert.equal(result.string, 'this is a string');
            });
        });

        describe('"bytes" key', function () {
            it('should exist', function () {
                assert.equal('bytes' in result, true);
            });
            it('should be a Buffer', function () {
                assert.equal(Buffer.isBuffer(result.bytes), true);
            });
            it('should have a length of 2', function () {
                assert.equal(result.bytes.length, 2);
            });
            it('and have correct value', function () {
                assert.equal(result.bytes[0], 1);
                assert.equal(result.bytes[1], 1);
            });
        });

        describe('"array" key', function () {
            it('should exist', function () {
                assert.equal('array' in result, true);
            });
            it('should be an Array', function () {
                assert.equal(Array.isArray(result.array), true);
            });
            it('should have a length of 4', function () {
                assert.equal(result.array.length, 4);
            });
            describe('array element 0', function () {
                it('should have correct value', function () {
                    assert.equal(result.array[0], 'string');
                });
            });
            describe('array element 1', function () {
                it('should have correct value', function () {
                    assert.equal(result.array[1], 1);
                });
            });
            describe('array element 2', function () {
                it('should have correct value', function () {
                    assert.equal(
                        Math.round(result.array[2] * 10000000) / 10000000, 2.2);
                });
            });
            describe('array element 3', function () {
                it('should have correct value', function () {
                    assert.equal(result.array[3], false);
                });
            });
        });

        describe('"obj key', function () {
            it('should exist', function () {
                assert.equal('obj' in result, true);
            });
            it('should be an object', function () {
                assert.equal(typeof result.obj, 'object');
            });
            describe('obj "str" key', function () {
                it('should exist', function () {
                    assert.equal('str' in result.obj, true);
                });
                it('should have correct value', function () {
                    assert.equal(result.obj.str, 'str');
                });
            });
            describe('obj "int" key', function () {
                it('should exist', function () {
                    assert.equal('int' in result.obj, true);
                });
                it('should have correct value', function () {
                    assert.equal(result.obj.int, 2);
                });
            });
            describe('obj "float" key', function () {
                it('should exist', function () {
                    assert.equal('float' in result.obj, true);
                });
                it('should have correct value', function () {
                    assert.equal(
                        Math.round(result.obj.float * 10000000) / 10000000, 2.3);
                });
            });
            describe('obj "bool" key', function () {
                it('should exist', function () {
                    assert.equal('bool' in result.obj, true);
                });
                it('should have correct value', function () {
                    assert.equal(result.obj.bool, true);
                });
            });

        });
    });
});


