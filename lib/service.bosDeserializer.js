"use strict";

const
    DataType = require('./const.DataType');

module.exports = {
    readSize: readSize,
    validate: validate,
    deserialize: deserialize
};

// Current read position
var pos = 0;
const MIN_BYTES = 5; // 4 bytes for size + 1 data type null (The smallest possible size)

/**
 * Read the size of serialized data in a buffer as specified by the serialized data.
 *
 * @param dataBuffer {Buffer} The buffer containing the serialized data.
 * @param [start=0]  {number} The index position of the start of the data to read.
 *
 * @returns {number} The integer size of the serialized data or -1 if the data isn't valid.
 */
function readSize(dataBuffer, start) {

    start = start || 0;

    if (dataBuffer.length - start < MIN_BYTES || start >= dataBuffer.length)
        return -1;

    return dataBuffer.readUInt32LE(start);
}

/**
 * Quickly validates serialized data by ensuring the supplied Buffer is complete.
 *
 * @param dataBuffer {Buffer}  The Buffer with serialized data to validate
 * @param [start=0]  {number}  The index position of the start of the data to deserialize.
 * @param [dataLen]  {number}  Optional length of data after index position in dataBuffer to consider.
 *
 * @returns {boolean} True if validated, otherwise false.
 */
function validate(dataBuffer, start, dataLen) {

    if (!dataBuffer)
        return false;

    start = start || 0;
    dataLen = typeof dataLen === 'number' ? dataLen : (dataBuffer.length - start);

    if (dataLen < MIN_BYTES)
        return false;

    if (dataLen > dataBuffer.length)
        return false;

    if (start >= dataBuffer.length)
        return false;

    // check that actual data is at least as long as the indicated data length
    const expectedLen = dataBuffer.readUInt32LE(start);
    return expectedLen >= MIN_BYTES && dataLen >= expectedLen;
}

/**
 * Deserializes binary data in a Buffer into a javascript value.
 * (i.e. a serialized array is returned as an array).
 *
 * @param dataBuffer {Buffer}  The buffer with serialized data.
 * @param [start=0]  {number}  The index position of the start of the data to deserialize.
 *
 * @returns {*} The deserialized value
 */
function deserialize(dataBuffer, start) {

    start = start || 0;

    if (dataBuffer.length < 5)
        throw new Error('Not valid data');

    pos = start;
    var len = dataBuffer.readUInt32LE(pos);
    if (len < 5)
        throw new Error('Not valid data');

    _incrementPos(4);

    if (dataBuffer.length - start < len)
        throw new Error('Incomplete buffer');

    return _read(dataBuffer);
}

function _incrementPos(amount) {
    pos += amount;
}

function _read(dataBuffer) {
    const dataType = _readDataType(dataBuffer);
    return _readData(dataType, dataBuffer);
}

function _readData(dataType, dataBuffer) {

    switch (dataType) {

        case DataType.NULL:
            return null;

        case DataType.BOOL:
            return _readBool(dataBuffer);

        case DataType.INT8:
            return _readInt8(dataBuffer);

        case DataType.INT16:
            return _readInt16(dataBuffer);

        case DataType.INT32:
            return _readInt32(dataBuffer);

        case DataType.UINT8:
            return _readUInt8(dataBuffer);

        case DataType.UINT16:
            return _readUInt16(dataBuffer);

        case DataType.UINT32:
            return _readUInt32(dataBuffer);

        case DataType.FLOAT:
            return _readFloat(dataBuffer);

        case DataType.DOUBLE:
            return _readDouble(dataBuffer);

        case DataType.STRING:
            return _readString(dataBuffer);

        case DataType.BYTES:
            return _readBytes(dataBuffer);

        case DataType.ARRAY:
            return _readArray(dataBuffer);

        case DataType.OBJ:
            return _readObj(dataBuffer);

        default:
            throw new Error('unrecognized data type: ' + dataType);
    }
}

function _readDataType(dataBuffer) {

    const dataType = dataBuffer.readUInt8(pos);
    if (!DataType.isValid(dataType))
        throw new Error('Invalid DataType: ' + dataType);

    _incrementPos(1);
    return dataType;
}

function _readBool(dataBuffer) {

    const val = dataBuffer.readUInt8(pos);
    _incrementPos(1);
    return !!val;
}

function _readInt8(dataBuffer) {

    const val = dataBuffer.readInt8(pos);
    _incrementPos(1);
    return val;
}

function _readInt16(dataBuffer) {

    const val = dataBuffer.readInt16LE(pos);
    _incrementPos(2);
    return val;
}

function _readInt32(dataBuffer) {

    const val = dataBuffer.readInt32LE(pos);
    _incrementPos(4);
    return val;
}

function _readUInt8(dataBuffer) {

    const val = dataBuffer.readUInt8(pos);
    _incrementPos(1);
    return val;
}

function _readUInt16(dataBuffer) {

    const val = dataBuffer.readUInt16LE(pos);
    _incrementPos(2);
    return val;
}

function _readUInt32(dataBuffer) {

    const val = dataBuffer.readUInt32LE(pos);
    _incrementPos(4);
    return val;
}

function _readUVarInt(dataBuffer) {

    var result = 0;

    const typeFlag = dataBuffer.readUInt8(pos);
    _incrementPos(1);

    switch (typeFlag) {
        case 0xFF:
            _incrementPos(8);
            break;

        case 0xFE:
            result = dataBuffer.readUInt32LE(pos);
            _incrementPos(4);
            break;

        case 0xFD:
            result = dataBuffer.readUInt16LE(pos);
            _incrementPos(2);
            break;

        default:
            result = typeFlag;
            break;
    }

    return result;
}

function _readFloat(dataBuffer) {

    const val = dataBuffer.readFloatLE(pos);
    _incrementPos(4);
    return val;
}

function _readDouble(dataBuffer) {

    const val = dataBuffer.readDoubleLE(pos);
    _incrementPos(8);
    return val;
}

function _readString(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    var result;
    if (len) {
        result = dataBuffer.toString('utf8', pos, pos + len);
        _incrementPos(len);
    }
    else {
        result = '';
    }

    return result;
}

function _readBytes(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    const buffer = Buffer.alloc(len);

    if (len) {
        dataBuffer.copy(buffer, 0, pos, pos + len);
        _incrementPos(len);
    }

    return buffer;
}

function _readArray(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    const result = [];

    for (var i=0; i < len; i++) {
        result.push(_read(dataBuffer));
    }

    return result;
}

function _readObj(dataBuffer) {

    const keyLen = _readUVarInt(dataBuffer);
    const result = {};

    for (var i = 0; i < keyLen; i++) {
        const keyName = _readString(dataBuffer, true /* isObjectKey */);
        result[keyName] = _read(dataBuffer);
    }

    return result;
}