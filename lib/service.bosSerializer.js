'use strict';

const DataType = require('./const.DataType');

module.exports = {
    serialize: serialize
};

let buffer = Buffer.alloc(2048);
let pos = 0;
let size = 0;

/**
 * Serializes an object (`obj`) and returns a Buffer with serialized data.
 *
 * @param obj {*}  The value to serialize.
 *
 * @returns {Buffer}
 */
function serialize(obj) {

    pos = 4;
    size = 4;

    _write(obj);

    buffer.writeUInt32LE(size, 0);

    const result = Buffer.alloc(size);
    buffer.copy(result, 0, 0, size);
    return result;
}


function _ensureBuffer(amount) {
    if (buffer.length < size + amount) {
        const oldBuffer = buffer;
        buffer = Buffer.alloc(Math.max(size + amount, size * 2));
        oldBuffer.copy(buffer, 0, 0, size);
    }
}


function _write(obj) {

    const dataType = DataType.getType(obj);

    switch (dataType) {

        case DataType.NULL:
            _writeNull();
            break;

        case DataType.BOOL:
            _writeBool(obj);
            break;

        case DataType.INT8:
            _writeInt8(obj);
            break;

        case DataType.INT16:
            _writeInt16(obj);
            break;

        case DataType.INT32:
            _writeInt32(obj);
            break;

        case DataType.UINT8:
            _writeUInt8(obj);
            break;

        case DataType.UINT16:
            _writeUInt16(obj);
            break;

        case DataType.UINT32:
            _writeUInt32(obj);
            break;

        case DataType.FLOAT:
            _writeFloat(obj);
            break;

        case DataType.DOUBLE:
            _writeDouble(obj);
            break;

        case DataType.STRING:
            _writeString(obj);
            break;

        case DataType.BYTES:
            _writeBytes(obj);
            break;

        case DataType.ARRAY:
            _writeArray(obj);
            break;

        case DataType.OBJ:
            _writeObj(obj);
            break;

        default:
            _writeNull();
    }
}


function _writeNull() {

    _ensureBuffer(1);
    size += 1;

    buffer.writeUInt8(DataType.NULL, pos);
    pos += 1;
}


function _writeBool(val) {

    _ensureBuffer(2);
    size += 2;

    // DataType
    buffer.writeUInt8(DataType.BOOL, pos);
    pos += 1;

    // Value
    buffer.writeUInt8(val ? 1 : 0, pos);
    pos += 1;
}


function _writeInt8(val) {

    _ensureBuffer(2);
    size += 2;

    // DataType
    buffer.writeUInt8(DataType.INT8, pos);
    pos += 1;

    // Value
    buffer.writeInt8(val, pos);
    pos += 1;
}


function _writeInt16(val) {

    _ensureBuffer(3);
    size += 3;

    // DataType
    buffer.writeUInt8(DataType.INT16, pos);
    pos += 1;

    // Value
    buffer.writeInt16LE(val, pos);
    pos += 2;
}


function _writeInt32(val) {

    _ensureBuffer(5);
    size += 5;

    // DataType
    buffer.writeUInt8(DataType.INT32, pos);
    pos += 1;

    // Value
    buffer.writeInt32LE(val, pos);
    pos += 4;
}


function _writeUInt8(val) {

    _ensureBuffer(2);
    size += 2;

    // DataType
    buffer.writeUInt8(DataType.UINT8, pos);
    pos += 1;

    // Value
    buffer.writeUInt8(val, pos);
    pos += 1;
}


function _writeUInt16(val) {

    _ensureBuffer(3);
    size += 3;

    // DataType
    buffer.writeUInt8(DataType.UINT16, pos);
    pos += 1;

    // Value
    buffer.writeUInt16LE(val, pos);
    pos += 2;
}


function _writeUInt32(val) {

    _ensureBuffer(5);
    size += 5;

    // DataType
    buffer.writeUInt8(DataType.UINT32, pos);
    pos += 1;

    // Value
    buffer.writeUInt32LE(val, pos);
    pos += 4;
}


function _writeUVarInt(val) {

    // https://en.bitcoin.it/wiki/Protocol_specification#Variable_length_integer
    // |Value	        | Size |	Format
    // |----------------|------|
    // | < 0xFD	        | 1	   | uint8_t
    // | <= 0xFFFF	    | 3	   | 0xFD followed by the length as uint16_t
    // | <= 0xFFFF FFFF	| 5	   | 0xFE followed by the length as uint32_t
    // | -	            | 9	   | 0xFF followed by the length as uint64_t

    if (val < 0xFD) {

        _ensureBuffer(1);
        size += 1;

        buffer.writeUInt8(val, pos);
        pos += 1;
    }
    else if (val <= 0xFFFF) {

        _ensureBuffer(3);
        size += 3;

        buffer.writeUInt8(0xFD, pos);
        pos += 1;

        buffer.writeUInt16LE(val, pos);
        pos += 2;
    }
    else if (val <= 0xFFFFFFFF) {

        _ensureBuffer(5);
        size += 5;

        buffer.writeUInt8(0xFE, pos);
        pos += 1;

        buffer.writeUInt32LE(val, pos);
        pos += 4;
    }
    else {
        _ensureBuffer(9);
        size += 9;

        buffer.writeUInt8(0xFF, pos);
        pos += 1;

        throw new Error('UInt64 not implemented');
    }
}


function _writeFloat(val) {

    _ensureBuffer(5);
    size += 5;

    // DataType
    buffer.writeUInt8(DataType.FLOAT, pos);
    pos += 1;

    // Value
    buffer.writeFloatLE(val, pos);
    pos += 4;
}


function _writeDouble(val) {

    _ensureBuffer(9);
    size += 9;

    // DataType
    buffer.writeUInt8(DataType.DOUBLE, pos);
    pos += 1;

    // Value
    buffer.writeDoubleLE(val, pos);
    pos += 8;
}


function _writeString(val) {

    const len = val ? Buffer.byteLength(val, 'utf8') : 0;

    // DataType
    _ensureBuffer(1);
    buffer.writeUInt8(DataType.STRING, pos);
    pos += 1;
    size += 1;

    // Length
    _writeUVarInt(len);

    // Value
    if (len) {
        _ensureBuffer(len);
        buffer.write(val, pos, len, 'utf8');
        pos += len;
        size += len;
    }
}


function _writeObjectKeyString(val) {

    const len = val ? Buffer.byteLength(val, 'utf8') : 0;

    // Length
    _writeUVarInt(len);

    // Value
    if (len) {
        _ensureBuffer(len);
        buffer.write(val, pos, len, 'utf8');
        pos += len;
        size += len;
    }
}


function _writeBytes(bytesBuffer) {

    const len = bytesBuffer ? bytesBuffer.length : 0;

    // DataType
    _ensureBuffer(1);
    buffer.writeUInt8(DataType.BYTES, pos);
    pos += 1;
    size += 1;

    // Length
    _writeUVarInt(len);

    // Bytes
    if (len) {
        _ensureBuffer(len);
        bytesBuffer.copy(buffer, pos, 0, len);
        pos += len;
        size += len;
    }
}


function _writeArray(array) {

    const len = array ? array.length : 0;

    // DataType
    _ensureBuffer(1);
    buffer.writeUInt8(DataType.ARRAY, pos);
    pos += 1;
    size += 1;

    // Count
    _writeUVarInt(len);

    // Values
    len && array.forEach(item => {
        _write(item);
    });
}


function _writeObj(obj) {

    const keys = Object.keys(obj);

    // DataType
    _ensureBuffer(1);
    buffer.writeUInt8(DataType.OBJ, pos);
    pos += 1;
    size += 1;

    // Count
    _writeUVarInt(keys.length);

    // KeyValues
    keys.forEach(key => {

        const objVal = obj[key];

        // KeyName
        _writeObjectKeyString(key);

        // Value
        _write(objVal);
    });
}
