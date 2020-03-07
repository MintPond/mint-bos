"use strict";

const
    assert = require('assert'),
    bosSerializer = require('../lib/service.bosSerializer'),
    bosDeserializer = require('../lib/service.bosDeserializer'),
    DataType = require('../lib/const.DataType');

describe('BosSerializer', function () {

    it('should serialize correctly', function () {
        const largeObj = {
            str: 'string of data',
            integer: 123,
            float: 12.3
        };
        const element = JSON.parse(JSON.stringify(largeObj));
        largeObj.array = [];
        for (let i = 0; i < 50; i++) {
            largeObj.array.push(element);
        }

        const refJson = JSON.stringify(largeObj);

        const serializedBuf = bosSerializer.serialize(largeObj);
        const deserialized = bosDeserializer.deserialize(serializedBuf);

        const json = JSON.stringify(deserialized);

        assert.strictEqual(refJson, json);
    });

    describe('serialize function', function () {

        var result;

        before(function () {
            result = bosSerializer.serialize({
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
        });

        it('should start with correct size', function () {
            const size = result.readUInt32LE(0);
            assert.equal(size, result.length);
        });

        it('followed by object type ID', function () {
            const dataType = result.readUInt8(4);
            assert.equal(dataType, DataType.OBJ);
        });

        it('followed by key length', function () {
            const keyLen = result.readUInt8(5);
            assert.equal(keyLen, 13);
        });

        describe('followed by "replyId" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(6);
                assert.equal(keyNameLen, 7);

                const keyName = result.toString('utf8', 7, 7 + 7);
                assert.equal(keyName, 'replyId');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(14);
                assert.equal(dataType, DataType.UINT8);
            });
            it('and value', function () {
                const value = result.readUInt8(15);
                assert.equal(value, 1);
            });
        });

        describe('followed by "bool" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(16);
                assert.equal(keyNameLen, 4);

                const keyName = result.toString('utf8', 17, 17 + 4);
                assert.equal(keyName, 'bool');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(21);
                assert.equal(dataType, DataType.BOOL);
            });
            it('and value', function () {
                const value = result.readUInt8(22);
                assert.equal(value, true);
            });
        });

        describe('followed by "int8" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(23);
                assert.equal(keyNameLen, 4);

                const keyName = result.toString('utf8', 24, 24 + 4);
                assert.equal(keyName, 'int8');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(28);
                assert.equal(dataType, DataType.INT8);
            });
            it('and value', function () {
                const value = result.readInt8(29);
                assert.equal(value, -1);
            });
        });

        describe('followed by "int16" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(30);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 31, 31 + 5);
                assert.equal(keyName, 'int16');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(36);
                assert.equal(dataType, DataType.INT16);
            });
            it('and value', function () {
                const value = result.readInt16LE(37);
                assert.equal(value, -300);
            });
        });

        describe('followed by "int32" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(39);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 40, 40 + 5);
                assert.equal(keyName, 'int32');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(45);
                assert.equal(dataType, DataType.INT32);
            });
            it('and value', function () {
                const value = result.readInt32LE(46);
                assert.equal(value, -2147483640);
            });
        });

        describe('followed by "uint8" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(50);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 51, 51 + 5);
                assert.equal(keyName, 'uint8');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(56);
                assert.equal(dataType, DataType.UINT8);
            });
            it('and value', function () {
                const value = result.readUInt8(57);
                assert.equal(value, 254);
            });
        });

        describe('followed by "uint16" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(58);
                assert.equal(keyNameLen, 6);

                const keyName = result.toString('utf8', 59, 59 + 6);
                assert.equal(keyName, 'uint16');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(65);
                assert.equal(dataType, DataType.UINT16);
            });
            it('and value', function () {
                const value = result.readUInt16LE(66);
                assert.equal(value, 4000);
            });
        });

        describe('followed by "uint32" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(68);
                assert.equal(keyNameLen, 6);

                const keyName = result.toString('utf8', 69, 69 + 6);
                assert.equal(keyName, 'uint32');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(75);
                assert.equal(dataType, DataType.UINT32);
            });
            it('and value', function () {
                const value = result.readUInt32LE(76);
                assert.equal(value, 4294967290);
            });
        });

        describe('followed by "float" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(80);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 81, 81 + 5);
                assert.equal(keyName, 'float');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(86);
                assert.equal(dataType, DataType.DOUBLE);
            });
            it('and value', function () {
                const value = result.readDoubleLE(87);
                assert.equal(value, 5.5);
            });
        });

        describe('followed by "string" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(95);
                assert.equal(keyNameLen, 6);

                const keyName = result.toString('utf8', 96, 96 + 6);
                assert.equal(keyName, 'string');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(102);
                assert.equal(dataType, DataType.STRING);
            });
            it('and value', function () {
                const strLen = result.readUInt8(103);
                assert.equal(strLen, 16);

                const value = result.toString('utf8', 104, 104 + 16);
                assert.equal(value, 'this is a string');
            });
        });

        describe('followed by "bytes" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(120);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 121, 121 + 5);
                assert.equal(keyName, 'bytes');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(126);
                assert.equal(dataType, DataType.BYTES);
            });
            it('and value', function () {
                const len = result.readUInt8(127);
                assert.equal(len, 2);

                assert.equal(result[128], 1);
                assert.equal(result[129], 1);
            });
        });

        describe('followed by "array" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(130);
                assert.equal(keyNameLen, 5);

                const keyName = result.toString('utf8', 131, 131 + 5);
                assert.equal(keyName, 'array');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(136);
                assert.equal(dataType, DataType.ARRAY);
            });
            it('followed by array length', function () {
                const len = result.readUInt8(137);
                assert.equal(len, 4);
            });
            describe('and array element 0', function () {
                it('should have a data type', function () {
                    const dataType = result.readUInt8(138);
                    assert.equal(dataType, DataType.STRING);
                });
                it('and value', function () {
                    const strLen = result.readUInt8(139);
                    assert.equal(strLen, 6);

                    const value = result.toString('utf8', 140, 140 + 6);
                    assert.equal(value, 'string');
                });
            });
            describe('and array element 1', function () {
                it('should have a data type', function () {
                    const dataType = result.readUInt8(146);
                    assert.equal(dataType, DataType.UINT8);
                });
                it('and value', function () {
                    const value = result.readUInt8(147);
                    assert.equal(value, 1);
                });
            });
            describe('and array element 2', function () {
                it('should have a data type', function () {
                    const dataType = result.readUInt8(148);
                    assert.equal(dataType, DataType.DOUBLE);
                });
                it('and value', function () {
                    const value = result.readDoubleLE(149);
                    assert.equal(
                        Math.round(value * 10000000) / 10000000, 2.2);
                });
            });
            describe('and array element 3', function () {
                it('should have a data type', function () {
                    const dataType = result.readUInt8(157);
                    assert.equal(dataType, DataType.BOOL);
                });
                it('and value', function () {
                    const value = result.readUInt8(158);
                    assert.equal(value, false);
                });
            });
        });

        describe('followed by "obj" key', function () {
            it('should have key name', function () {
                const keyNameLen = result.readUInt8(159);
                assert.equal(keyNameLen, 3);

                const keyName = result.toString('utf8', 160, 160 + 3);
                assert.equal(keyName, 'obj');
            });
            it('followed by value type', function () {
                const dataType = result.readUInt8(163);
                assert.equal(dataType, DataType.OBJ);
            });
            it('followed by key length', function () {
                const len = result.readUInt8(164);
                assert.equal(len, 4);
            });
            describe('obj "str" key', function () {
                it('should have keyName', function () {
                    const keyNameLen = result.readUInt8(165);
                    assert.equal(keyNameLen, 3);

                    const keyName = result.toString('utf8', 166, 166 + 3);
                    assert.equal(keyName, 'str');
                });
                it('followed by value type', function () {
                    const dataType = result.readUInt8(169);
                    assert.equal(dataType, DataType.STRING);
                });
                it('and value', function () {
                    const strLen = result.readUInt8(170);
                    assert.equal(strLen, 3);

                    const value = result.toString('utf8', 171, 171 + 3);
                    assert.equal(value, 'str');
                });
            });
            describe('obj "int" key', function () {
                it('should have keyName', function () {
                    const keyNameLen = result.readUInt8(174);
                    assert.equal(keyNameLen, 3);

                    const keyName = result.toString('utf8', 175, 175 + 3);
                    assert.equal(keyName, 'int');
                });
                it('followed by value type', function () {
                    const dataType = result.readUInt8(178);
                    assert.equal(dataType, DataType.UINT8);
                });
                it('and value', function () {
                    const value = result.readUInt8(179);
                    assert.equal(value, 2);
                });
            });
            describe('obj "float" key', function () {
                it('should have keyName', function () {
                    const keyNameLen = result.readUInt8(180);
                    assert.equal(keyNameLen, 5);

                    const keyName = result.toString('utf8', 181, 181 + 5);
                    assert.equal(keyName, 'float');
                });
                it('followed by value type', function () {
                    const dataType = result.readUInt8(186);
                    assert.equal(dataType, DataType.DOUBLE);
                });
                it('and value', function () {
                    const value = result.readDoubleLE(187);
                    assert.equal(
                        Math.round(value * 10000000) / 10000000, 2.3);
                });
            });
            describe('obj "bool" key', function () {
                it('should have keyName', function () {
                    const keyNameLen = result.readUInt8(195);
                    assert.equal(keyNameLen, 4);

                    const keyName = result.toString('utf8', 196, 196 + 4);
                    assert.equal(keyName, 'bool');
                });
                it('followed by value type', function () {
                    const dataType = result.readUInt8(200);
                    assert.equal(dataType, DataType.BOOL);
                });
                it('and value', function () {
                    const value = result.readUInt8(201);
                    assert.equal(value, true);
                });
            });
        });
    });
});


