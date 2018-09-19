"use strict";

const DataType = require('./const.DataType');
const NULL_BUFFER = Buffer.alloc(1, DataType.NULL);

module.exports = {
    serialize: serialize
};

var size = 0;

/**
 * Serializes an object (`obj`) and returns a Buffer with serialized data.
 *
 * @param obj {*}  The value to serialize.
 *
 * @returns {Buffer}
 */
function serialize(obj) {

    const sizeBuffer = Buffer.alloc(4);
    const buffers = [sizeBuffer];

    size = 4;

    _write(obj, buffers, []);

    sizeBuffer.writeUInt32LE(size, 0);

    return Buffer.concat(buffers);
}

function _checkCircularReference(obj, referenceChain) {
    if (referenceChain.indexOf(obj) !== -1) {
        throw new Error('Circular reference detected');
    }
}

function _write(obj, arrayOut, referenceChain) {

    const dataType = DataType.getType(obj);

    switch (dataType) {

        case DataType.NULL:
            _writeNull(arrayOut);
            break;

        case DataType.BOOL:
            _writeBool(obj, arrayOut);
            break;

        case DataType.INT8:
            _writeInt8(obj, arrayOut);
            break;

        case DataType.INT16:
            _writeInt16(obj, arrayOut);
            break;

        case DataType.INT32:
            _writeInt32(obj, arrayOut);
            break;

        case DataType.UINT8:
            _writeUInt8(obj, arrayOut);
            break;

        case DataType.UINT16:
            _writeUInt16(obj, arrayOut);
            break;

        case DataType.UINT32:
            _writeUInt32(obj, arrayOut);
            break;

        case DataType.FLOAT:
            _writeFloat(obj, arrayOut);
            break;

        case DataType.DOUBLE:
            _writeDouble(obj, arrayOut);
            break;

        case DataType.STRING:
            _writeString(obj, arrayOut);
            break;

        case DataType.BYTES:
            _writeBytes(obj, arrayOut);
            break;

        case DataType.ARRAY:
            _writeArray(obj, arrayOut, referenceChain);
            break;

        case DataType.OBJ:
            _writeObj(obj, arrayOut, referenceChain);
            break;

        default:
            throw new Error('Invalid data type: ' + dataType);
    }
}

function _writeNull(arrayOut) {
    size += 1;
    arrayOut.push(NULL_BUFFER);
}

function _writeBool(val, arrayOut) {

    const buffer = Buffer.alloc(2);

    // DataType
    buffer.writeUInt8(DataType.BOOL, 0);

    // Value
    buffer.writeUInt8(val ? 1 : 0, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeInt8(val, arrayOut) {

    const buffer = Buffer.alloc(2);

    // DataType
    buffer.writeUInt8(DataType.INT8, 0);

    // Value
    buffer.writeInt8(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeInt16(val, arrayOut) {

    const buffer = Buffer.alloc(3);

    // DataType
    buffer.writeUInt8(DataType.INT16, 0);

    // Value
    buffer.writeInt16LE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeInt32(val, arrayOut) {

    const buffer = Buffer.alloc(5);

    // DataType
    buffer.writeUInt8(DataType.INT32, 0);

    // Value
    buffer.writeInt32LE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeUInt8(val, arrayOut) {

    const buffer = Buffer.alloc(2);

    // DataType
    buffer.writeUInt8(DataType.UINT8, 0);

    // Value
    buffer.writeUInt8(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeUInt16(val, arrayOut) {

    const buffer = Buffer.alloc(3);

    // DataType
    buffer.writeUInt8(DataType.UINT16, 0);

    // Value
    buffer.writeUInt16LE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeUInt32(val, arrayOut) {

    const buffer = Buffer.alloc(5);

    // DataType
    buffer.writeUInt8(DataType.UINT32, 0);

    // Value
    buffer.writeUInt32LE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeUVarInt(val, arrayOut) {

    // https://en.bitcoin.it/wiki/Protocol_specification#Variable_length_integer
    // |Value	        | Size |	Format
    // |----------------|------|
    // | < 0xFD	        | 1	   | uint8_t
    // | <= 0xFFFF	    | 3	   | 0xFD followed by the length as uint16_t
    // | <= 0xFFFF FFFF	| 5	   | 0xFE followed by the length as uint32_t
    // | -	            | 9	   | 0xFF followed by the length as uint64_t

    var buffer;

    if (val < 0xFD) {
        buffer = Buffer.alloc(1);
        buffer.writeUInt8(val, 0);

    } else if (val <= 0xFFFF) {

        buffer = Buffer.alloc(3);
        buffer.writeUInt8(0xFD, 0);
        buffer.writeUInt16LE(val, 1);

    } else if (val <= 0xFFFFFFFF) {

        buffer = Buffer.alloc(5);
        buffer.writeUInt8(0xFE, 0);
        buffer.writeUInt32LE(val, 1);

    } else {
        buffer = Buffer.alloc(9);
        buffer.writeUInt8(0xFF, 0);
        throw new Error('UInt64 not implemented');
    }

    arrayOut.push(buffer);
    return buffer.length;
}

function _writeFloat(val, arrayOut) {

    const buffer = Buffer.alloc(5);

    // DataType
    buffer.writeUInt8(DataType.FLOAT, 0);

    // Value
    buffer.writeFloatLE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeDouble(val, arrayOut) {

    const buffer = Buffer.alloc(9);

    // DataType
    buffer.writeUInt8(DataType.DOUBLE, 0);

    // Value
    buffer.writeDoubleLE(val, 1);

    size += buffer.length;
    arrayOut.push(buffer);
}

function _writeString(val, arrayOut) {

    const len = val ? Buffer.byteLength(val, 'utf8') : 0;
    if (len > 65535)
        throw new Error('String is too long: ' + val);

    // DataType
    const typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(DataType.STRING, 0);
    arrayOut.push(typeBuffer);

    // Length
    const uvarintLen = _writeUVarInt(len, arrayOut);

    // Value
    if (len) {
        arrayOut.push(Buffer.from(val, 'utf8'));
    }

    size += 1 + uvarintLen + len;
}

function _writeObjectKeyString(val, arrayOut) {

    const len = val ? Buffer.byteLength(val, 'utf8') : 0;
    if (len > 255)
        throw new Error('String is too long: ' + val);

    // Length
    const uvarintLen = _writeUVarInt(len, arrayOut);

    // Value
    if (len) {
        arrayOut.push(Buffer.from(val, 'utf8'));
    }

    size += len + uvarintLen;
}

function _writeBytes(bytesBuffer, arrayOut) {

    const len = bytesBuffer ? bytesBuffer.length : 0;

    // DataType
    const typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(DataType.BYTES, 0);
    arrayOut.push(typeBuffer);

    // Length
    const uvarintLen = _writeUVarInt(len, arrayOut);

    // Bytes
    if (len) {
        const buffer = Buffer.alloc(len);
        bytesBuffer.copy(buffer, 0, 0);
        arrayOut.push(buffer);
    }

    size += 1 + uvarintLen + len;
}

function _writeArray(array, arrayOut, referenceChain) {

    _checkCircularReference(array, referenceChain);
    referenceChain.push(array);

    const len = array ? array.length : 0;

    // DataType
    const typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(DataType.ARRAY, 0);
    arrayOut.push(typeBuffer);

    // Count
    const uvarintLen = _writeUVarInt(len, arrayOut);

    // Values
    len && array.forEach(function (item) {
        _write(item, arrayOut, referenceChain);
    });

    size += 1 + uvarintLen;

    referenceChain.pop();
}

function _writeObj(obj, arrayOut, referenceChain) {

    _checkCircularReference(obj, referenceChain);
    referenceChain.push(obj);

    if (DataType.isNull(obj)) {
        _writeNull(arrayOut);
        return;
    }

    const keys = Object.keys(obj);

    // DataType
    const typeBuffer = Buffer.alloc(1);
    typeBuffer.writeUInt8(DataType.OBJ);
    arrayOut.push(typeBuffer);

    // Count
    const uvarintLen = _writeUVarInt(keys.length, arrayOut);

    // KeyValues
    keys.forEach(function (key) {

        const objVal = obj[key];

        if (!DataType.isSerializable(objVal))
            return; // continue

        // KeyName
        _writeObjectKeyString(key, arrayOut);

        // Value
        _write(objVal, arrayOut, referenceChain);
    });

    size += 1 + uvarintLen;

    referenceChain.pop();
}
