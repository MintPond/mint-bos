'use strict';

const
    assert = require('assert'),
    bosSerializer = require('../lib/service.bosSerializer'),
    bosDeserializer = require('../lib/service.bosDeserializer'),
    DataType = require('../lib/const.DataType');


describe('BosSerializer', () => {

    it('should serialize correctly', () => {
        const largeObj = {
            str: 'string of data',
            integer: 123,
            float: 12.3
        };
        const element = {...largeObj};
        largeObj.array = [];
        for (let i = 0; i < 50; i++) {
            largeObj.array.push(element);
        }

        const refJson = JSON.stringify(largeObj);

        const serializedBuf = bosSerializer.serialize(largeObj);
        const deserialized = bosDeserializer.deserialize(serializedBuf);

        delete deserialized._bufferTimeMs;
        const json = JSON.stringify(deserialized);

        assert.strictEqual(refJson, json);
    });

    describe('"serialize" function', () => {

        let serializedBuf;

        before(() => {
            serializedBuf = bosSerializer.serialize({
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

        it('should start with correct size', () => {
            const size = serializedBuf.readUInt32LE(0);
            assert.strictEqual(size, serializedBuf.length);
        });

        it('should have object type ID', () => {
            const dataType = serializedBuf.readUInt8(4);
            assert.strictEqual(dataType, DataType.OBJ);
        });

        it('should have key length', () => {
            const keyLen = serializedBuf.readUInt8(5);
            assert.strictEqual(keyLen, 13);
        });

        describe('"replyId" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(6);
                assert.strictEqual(keyNameLen, 7);

                const keyName = serializedBuf.toString('utf8', 7, 7 + 7);
                assert.strictEqual(keyName, 'replyId');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(14);
                assert.strictEqual(dataType, DataType.UINT8);
            });

            it('should have value', () => {
                const value = serializedBuf.readUInt8(15);
                assert.strictEqual(value, 1);
            });
        });

        describe('"bool" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(16);
                assert.strictEqual(keyNameLen, 4);

                const keyName = serializedBuf.toString('utf8', 17, 17 + 4);
                assert.strictEqual(keyName, 'bool');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(21);
                assert.strictEqual(dataType, DataType.BOOL);
            });

            it('should have value', () => {
                const value = serializedBuf.readUInt8(22);
                assert.strictEqual(value, 1);
            });
        });

        describe('"int8" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(23);
                assert.strictEqual(keyNameLen, 4);

                const keyName = serializedBuf.toString('utf8', 24, 24 + 4);
                assert.strictEqual(keyName, 'int8');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(28);
                assert.strictEqual(dataType, DataType.INT8);
            });

            it('should have value', () => {
                const value = serializedBuf.readInt8(29);
                assert.strictEqual(value, -1);
            });
        });

        describe('"int16" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(30);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 31, 31 + 5);
                assert.strictEqual(keyName, 'int16');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(36);
                assert.strictEqual(dataType, DataType.INT16);
            });
            it('should have value', () => {
                const value = serializedBuf.readInt16LE(37);
                assert.strictEqual(value, -300);
            });
        });

        describe('"int32" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(39);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 40, 40 + 5);
                assert.strictEqual(keyName, 'int32');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(45);
                assert.strictEqual(dataType, DataType.INT32);
            });
            it('should have value', () => {
                const value = serializedBuf.readInt32LE(46);
                assert.strictEqual(value, -2147483640);
            });
        });

        describe('"uint8" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(50);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 51, 51 + 5);
                assert.strictEqual(keyName, 'uint8');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(56);
                assert.strictEqual(dataType, DataType.UINT8);
            });

            it('should have value', () => {
                const value = serializedBuf.readUInt8(57);
                assert.strictEqual(value, 254);
            });
        });

        describe('"uint16" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(58);
                assert.strictEqual(keyNameLen, 6);

                const keyName = serializedBuf.toString('utf8', 59, 59 + 6);
                assert.strictEqual(keyName, 'uint16');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(65);
                assert.strictEqual(dataType, DataType.UINT16);
            });

            it('should have value', () => {
                const value = serializedBuf.readUInt16LE(66);
                assert.strictEqual(value, 4000);
            });
        });

        describe('"uint32" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(68);
                assert.strictEqual(keyNameLen, 6);

                const keyName = serializedBuf.toString('utf8', 69, 69 + 6);
                assert.strictEqual(keyName, 'uint32');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(75);
                assert.strictEqual(dataType, DataType.UINT32);
            });

            it('should have value', () => {
                const value = serializedBuf.readUInt32LE(76);
                assert.strictEqual(value, 4294967290);
            });
        });

        describe('"float" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(80);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 81, 81 + 5);
                assert.strictEqual(keyName, 'float');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(86);
                assert.strictEqual(dataType, DataType.DOUBLE);
            });

            it('should have value', () => {
                const value = serializedBuf.readDoubleLE(87);
                assert.strictEqual(value, 5.5);
            });
        });

        describe('"string" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(95);
                assert.strictEqual(keyNameLen, 6);

                const keyName = serializedBuf.toString('utf8', 96, 96 + 6);
                assert.strictEqual(keyName, 'string');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(102);
                assert.strictEqual(dataType, DataType.STRING);
            });

            it('should have value', () => {
                const strLen = serializedBuf.readUInt8(103);
                assert.strictEqual(strLen, 16);

                const value = serializedBuf.toString('utf8', 104, 104 + 16);
                assert.strictEqual(value, 'this is a string');
            });
        });

        describe('"bytes" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(120);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 121, 121 + 5);
                assert.strictEqual(keyName, 'bytes');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(126);
                assert.strictEqual(dataType, DataType.BYTES);
            });

            it('should have value', () => {
                const len = serializedBuf.readUInt8(127);
                assert.strictEqual(len, 2);

                assert.strictEqual(serializedBuf[128], 1);
                assert.strictEqual(serializedBuf[129], 1);
            });
        });

        describe('"array" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(130);
                assert.strictEqual(keyNameLen, 5);

                const keyName = serializedBuf.toString('utf8', 131, 131 + 5);
                assert.strictEqual(keyName, 'array');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(136);
                assert.strictEqual(dataType, DataType.ARRAY);
            });

            it('should have array length', () => {
                const len = serializedBuf.readUInt8(137);
                assert.strictEqual(len, 4);
            });

            describe('array[0]', () => {

                it('should have a data type', () => {
                    const dataType = serializedBuf.readUInt8(138);
                    assert.strictEqual(dataType, DataType.STRING);
                });

                it('should have value', () => {
                    const strLen = serializedBuf.readUInt8(139);
                    assert.strictEqual(strLen, 6);

                    const value = serializedBuf.toString('utf8', 140, 140 + 6);
                    assert.strictEqual(value, 'string');
                });
            });

            describe('array[1]', () => {

                it('should have a data type', () => {
                    const dataType = serializedBuf.readUInt8(146);
                    assert.strictEqual(dataType, DataType.UINT8);
                });

                it('should have value', () => {
                    const value = serializedBuf.readUInt8(147);
                    assert.strictEqual(value, 1);
                });
            });

            describe('array[2]', () => {

                it('should have a data type', () => {
                    const dataType = serializedBuf.readUInt8(148);
                    assert.strictEqual(dataType, DataType.DOUBLE);
                });

                it('should have value', () => {
                    const value = serializedBuf.readDoubleLE(149);
                    assert.strictEqual(
                        Math.round(value * 10000000) / 10000000, 2.2);
                });
            });

            describe('array[3]', () => {

                it('should have a data type', () => {
                    const dataType = serializedBuf.readUInt8(157);
                    assert.strictEqual(dataType, DataType.BOOL);
                });

                it('should have value', () => {
                    const value = serializedBuf.readUInt8(158);
                    assert.strictEqual(value, 0);
                });
            });
        });

        describe('"obj" entry', () => {

            it('should have key name', () => {
                const keyNameLen = serializedBuf.readUInt8(159);
                assert.strictEqual(keyNameLen, 3);

                const keyName = serializedBuf.toString('utf8', 160, 160 + 3);
                assert.strictEqual(keyName, 'obj');
            });

            it('should have value type', () => {
                const dataType = serializedBuf.readUInt8(163);
                assert.strictEqual(dataType, DataType.OBJ);
            });

            it('should have key length', () => {
                const len = serializedBuf.readUInt8(164);
                assert.strictEqual(len, 4);
            });

            describe('"str" entry', () => {

                it('should have keyName', () => {
                    const keyNameLen = serializedBuf.readUInt8(165);
                    assert.strictEqual(keyNameLen, 3);

                    const keyName = serializedBuf.toString('utf8', 166, 166 + 3);
                    assert.strictEqual(keyName, 'str');
                });

                it('should have value type', () => {
                    const dataType = serializedBuf.readUInt8(169);
                    assert.strictEqual(dataType, DataType.STRING);
                });

                it('should have value', () => {
                    const strLen = serializedBuf.readUInt8(170);
                    assert.strictEqual(strLen, 3);

                    const value = serializedBuf.toString('utf8', 171, 171 + 3);
                    assert.strictEqual(value, 'str');
                });
            });

            describe('"int" entry', () => {

                it('should have keyName', () => {
                    const keyNameLen = serializedBuf.readUInt8(174);
                    assert.strictEqual(keyNameLen, 3);

                    const keyName = serializedBuf.toString('utf8', 175, 175 + 3);
                    assert.strictEqual(keyName, 'int');
                });

                it('should have value type', () => {
                    const dataType = serializedBuf.readUInt8(178);
                    assert.strictEqual(dataType, DataType.UINT8);
                });

                it('should have value', () => {
                    const value = serializedBuf.readUInt8(179);
                    assert.strictEqual(value, 2);
                });
            });

            describe('"float" entry', () => {

                it('should have keyName', () => {
                    const keyNameLen = serializedBuf.readUInt8(180);
                    assert.strictEqual(keyNameLen, 5);

                    const keyName = serializedBuf.toString('utf8', 181, 181 + 5);
                    assert.strictEqual(keyName, 'float');
                });

                it('should have value type', () => {
                    const dataType = serializedBuf.readUInt8(186);
                    assert.strictEqual(dataType, DataType.DOUBLE);
                });

                it('should have value', () => {
                    const value = serializedBuf.readDoubleLE(187);
                    assert.strictEqual(
                        Math.round(value * 10000000) / 10000000, 2.3);
                });
            });

            describe('"bool" entry', () => {

                it('should have keyName', () => {
                    const keyNameLen = serializedBuf.readUInt8(195);
                    assert.strictEqual(keyNameLen, 4);

                    const keyName = serializedBuf.toString('utf8', 196, 196 + 4);
                    assert.strictEqual(keyName, 'bool');
                });

                it('should have value type', () => {
                    const dataType = serializedBuf.readUInt8(200);
                    assert.strictEqual(dataType, DataType.BOOL);
                });

                it('should have value', () => {
                    const value = serializedBuf.readUInt8(201);
                    assert.strictEqual(value, 1);
                });
            });
        });
    });
});