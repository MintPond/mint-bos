'use strict';

const
    precon = require('@mintpond/mint-precon'),
    DataType = require('./const.DataType');

module.exports = {
    readSize: readSize,
    validate: validate,
    deserialize: deserialize
};

// Current read position
let pos = 0;

// total bytes read
let read = 0;

// size of data being read (as indicated by the first 4 bytes of the data)
let dataLen = 0;

// 4 bytes for size + 1 data type null (The smallest possible size)
const MIN_BYTES = 5;

// Maximum depth of object allowed. 0 for unlimited
let maxObjDepth = 0;

// Maximum bytes allowed for the "Bytes" data type. 0 for unlimited (hardcoded max exists because of Buffer limitations)
let maxBytesTypeLen = 0;

let depth = 0;

// internal error result object
const ERROR = {};

let errorMessage = null;

/**
 * Read the size of serialized data in a buffer as specified by the serialized data.
 *
 * @param dataBuffer {Buffer} The buffer containing the serialized data.
 * @param [start=0]  {number} The index position of the start of the data to read.
 *
 * @returns {number} The integer size of the serialized data or -1 if the data isn't valid.
 */
function readSize(dataBuffer, start) {
    precon.buffer(dataBuffer, 'dataBuffer');
    precon.opt_positiveInteger(start, 'start');

    start = start || 0;

    if (dataBuffer.length - start < MIN_BYTES || start >= dataBuffer.length)
        return -1;

    return dataBuffer.readUInt32LE(start);
}


/**
 * Quickly validates serialized data by ensuring the supplied Buffer is complete.
 *
 * @param [dataBuffer] {Buffer}  The Buffer with serialized data to validate
 * @param [start=0]    {number}  The index position of the start of the data to deserialize.
 * @param [dataLen]    {number}  The length of data after index position in dataBuffer to consider.
 *
 * @returns {boolean} True if validated, otherwise false.
 */
function validate(dataBuffer, start, dataLen) {
    precon.opt_buffer(dataBuffer, 'dataBuffer');
    precon.opt_positiveInteger(start, 'start');
    precon.opt_positiveInteger(dataLen, 'dataLen');

    if (!dataBuffer)
        return false;

    start = start || 0;
    dataLen = typeof dataLen === 'number' ? dataLen : (dataBuffer.length - start);

    if (dataLen < MIN_BYTES)
        return false;

    if (start >= dataBuffer.length)
        return false;

    if (start + dataLen > dataBuffer.length)
        return false;

    // check that actual data is at least as long as the indicated data length
    const expectedLen = dataBuffer.readUInt32LE(start);
    return expectedLen >= MIN_BYTES && dataLen >= expectedLen;
}


/**
 * Deserializes binary data in a Buffer into a javascript value.
 * (i.e. a serialized array is returned as an array).
 *
 * @param dataBuffer               {Buffer}   The buffer with serialized data.
 * @param [start=0]                {number}   The index position of the start of the data to deserialize.
 * @param [limits]                 {object}   Object containing limit configuration.
 * @param [limits].maxDepth        {number}   The maximum recursion depth allowed. Use 0 for infinite.
 * @param [limits].maxBytesTypeLen {number}   The maximum length allowed in a Bytes value. Use 0 for infinite.
 * @param [errOutputArray]         {string[]} An array to push error messages into.
 *
 * @returns {*} The deserialized value or undefined if there is an error parsing.
 */
function deserialize(dataBuffer, start, limits, errOutputArray) {
    precon.buffer(dataBuffer, 'dataBuffer');
    precon.opt_positiveInteger(start, 'start');
    precon.opt_obj(limits, 'limits');
    limits && precon.opt_positiveInteger(limits.maxDepth, 'limits.maxDepth');
    limits && precon.opt_positiveInteger(limits.maxBytesTypeLen, 'limits.maxBytesTypeLen');
    precon.opt_array(errOutputArray, 'errOutputArray');

    const maxDepth = limits ? limits.maxDepth : 0;
    const maxBytes = limits ? limits.maxBytesTypeLen : 0;

    start = start || 0;
    maxObjDepth = maxDepth || 0;
    maxBytesTypeLen = maxBytes || 0;
    depth = 0;
    errorMessage = null;

    if (dataBuffer.length < 5) {
        //throw new Error('Not valid data');
        errOutputArray && errOutputArray.push('Not valid data. dataBuffer too short to be possible.');
        return undefined;
    }

    pos = start;
    dataLen = dataBuffer.readUInt32LE(pos);
    if (dataLen < 5) {
        //throw new Error('Not valid data');
        errOutputArray && errOutputArray.push('Not valid data. Specified data len too short to be possible.');
        return undefined;
    }

    read = 4;
    pos += 4;

    if (dataBuffer.length - start < dataLen) {
        //throw new Error('Incomplete buffer');
        errOutputArray && errOutputArray.push('Incomplete buffer');
        return undefined;
    }

    const result = _read(dataBuffer, errOutputArray);
    if (result === ERROR || read !== dataLen) {
        errOutputArray && errOutputArray.push(errorMessage);
        return undefined;
    }

    return result;
}


function _read(dataBuffer) {
    const dataType = _readDataType(dataBuffer);
    if (dataType === ERROR)
        return ERROR;

    return _readData(dataType, dataBuffer);
}


function _readData(dataType, dataBuffer) {

    depth++;
    if (maxObjDepth && depth > maxObjDepth) {
        errorMessage = `Object depth exceeds maximum (${depth}/${maxObjDepth})`;
        return ERROR;
    }

    let value = undefined;

    switch (dataType) {

        case DataType.NULL:
            value = null;
            break;

        case DataType.BOOL:
            value = _readBool(dataBuffer);
            break;

        case DataType.INT8:
            value = _readInt8(dataBuffer);
            break;

        case DataType.INT16:
            value = _readInt16(dataBuffer);
            break;

        case DataType.INT32:
            value = _readInt32(dataBuffer);
            break;

        case DataType.INT64:
            value = _readInt64(dataBuffer);
            break;

        case DataType.UINT8:
            value = _readUInt8(dataBuffer);
            break;

        case DataType.UINT16:
            value = _readUInt16(dataBuffer);
            break;

        case DataType.UINT32:
            value = _readUInt32(dataBuffer);
            break;

        case DataType.UINT64:
            value = _readUInt64(dataBuffer);
            break;

        case DataType.FLOAT:
            value = _readFloat(dataBuffer);
            break;

        case DataType.DOUBLE:
            value = _readDouble(dataBuffer);
            break;

        case DataType.STRING:
            value = _readString(dataBuffer);
            break;

        case DataType.BYTES:
            value = _readBytes(dataBuffer);
            break;

        case DataType.ARRAY:
            value = _readArray(dataBuffer);
            break;

        case DataType.OBJ:
            value = _readObj(dataBuffer);
            break;

        default:
            errorMessage = `Unrecognized data type: ${dataType}`;
            return ERROR;
    }

    depth--;
    return value;
}


function _readDataType(dataBuffer) {

    if (read + 1 > dataLen) {
        errorMessage = 'Data too short (data type)';
        return ERROR;
    }

    const dataType = dataBuffer.readUInt8(pos);
    if (!DataType.isValid(dataType)) {
        errorMessage = `Invalid DataType: ${dataType}`;
        return ERROR;
    }

    pos += 1;
    read += 1;
    return dataType;
}


function _readBool(dataBuffer) {

    if (read + 1 > dataLen) {
        errorMessage = 'Data too short (bool)';
        return ERROR;
    }

    const val = dataBuffer.readUInt8(pos);
    pos += 1;
    read += 1;

    return !!val;
}


function _readInt8(dataBuffer) {

    if (read + 1 > dataLen) {
        errorMessage = 'Data too short (int8)';
        return ERROR;
    }

    const val = dataBuffer.readInt8(pos);
    pos += 1;
    read += 1;

    return val;
}


function _readInt16(dataBuffer) {

    if (read + 2 > dataLen) {
        errorMessage = 'Data too short (int16)';
        return ERROR;
    }

    const val = dataBuffer.readInt16LE(pos);
    pos += 2;
    read += 2;

    return val;
}


function _readInt32(dataBuffer) {

    if (read + 4 > dataLen) {
        errorMessage = 'Data too short (int32)';
        return ERROR;
    }

    const val = dataBuffer.readInt32LE(pos);
    pos += 4;
    read += 4;

    return val;
}


function _readInt64(dataBuffer) {
    // Not implemented
    return _readUInt64(dataBuffer);
}


function _readUInt8(dataBuffer) {

    if (read + 1 > dataLen) {
        errorMessage = 'Data too short (uint8)';
        return ERROR;
    }

    const val = dataBuffer.readUInt8(pos);
    pos += 1;
    read += 1;

    return val;
}


function _readUInt16(dataBuffer) {

    if (read + 2 > dataLen) {
        errorMessage = 'Data too short (uint16)';
        return ERROR;
    }

    const val = dataBuffer.readUInt16LE(pos);
    pos += 2;
    read += 2;

    return val;
}


function _readUInt32(dataBuffer) {

    if (read + 4 > dataLen) {
        errorMessage = 'Data too short (uint32)';
        return ERROR;
    }

    const val = dataBuffer.readUInt32LE(pos);
    pos += 4;
    read += 4;

    return val;
}


function _readUInt64(dataBuffer) {

    if (read + 8 > dataLen) {
        errorMessage = 'Data too short (uint64)';
        return ERROR;
    }

    const numBuffer = Buffer.alloc(8);
    dataBuffer.copy(numBuffer, 0, pos);

    const rightBi = BigInt(numBuffer.readUInt32LE(0));
    const leftBi = BigInt(numBuffer.readUInt32LE(4)) << 32n;

    const val = parseInt(rightBi + leftBi);
    pos += 8;
    read += 8;

    return val;
}


function _readUVarInt(dataBuffer) {

    if (read + 1 > dataLen) {
        errorMessage = 'Data too short (uvarint data len)';
        return ERROR;
    }

    let result = 0;

    const typeFlag = dataBuffer.readUInt8(pos);
    pos += 1;
    read += 1;

    switch (typeFlag) {
        case 0xFF:
            if (read + 8 > dataLen) {
                errorMessage = 'Data too short (uvarint 0xFF)';
                return ERROR;
            }
            pos += 8;
            read += 8;
            break;

        case 0xFE:
            if (read + 4 > dataLen) {
                errorMessage = 'Data too short (uvarint 0xFE)';
                return ERROR;
            }
            result = dataBuffer.readUInt32LE(pos);
            if (result > 2147483647) {
                errorMessage = 'Data too long. Cannot be larger than 2147483647';
                return ERROR;
            }
            pos += 4;
            read += 4;
            break;

        case 0xFD:
            if (read + 2 > dataLen) {
                errorMessage = 'Data too short (uvarint 0xFD)';
                return ERROR;
            }
            result = dataBuffer.readUInt16LE(pos);
            pos += 2;
            read += 2;
            break;

        default:
            result = typeFlag;
            break;
    }

    return result;
}


function _readFloat(dataBuffer) {

    if (read + 4 > dataLen) {
        errorMessage = 'Data too short (float)';
        return ERROR;
    }

    const val = dataBuffer.readFloatLE(pos);
    pos += 4;
    read += 4;

    return val;
}


function _readDouble(dataBuffer) {

    if (read + 8 > dataLen) {
        errorMessage = 'Data too short (double)';
        return ERROR;
    }

    const val = dataBuffer.readDoubleLE(pos);
    pos += 8;
    read += 8;

    return val;
}


function _readString(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    if (len === ERROR)
        return ERROR;

    let result;
    if (len) {
        if (read + len > dataLen) {
            errorMessage = 'Data too short (string)';
            return ERROR;
        }

        result = dataBuffer.toString('utf8', pos, pos + len);
        pos += len;
        read += len;
    }
    else {
        result = '';
    }

    return result;
}


function _readBytes(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    if (len === ERROR)
        return ERROR;

    if (maxBytesTypeLen && len > maxBytesTypeLen) {
        errorMessage = `Bytes length exceeds max: ${len}/${maxBytesTypeLen}`;
        return ERROR;
    }

    const buffer = Buffer.alloc(len);

    if (len) {
        if (read + len > dataLen)
            return ERROR;

        dataBuffer.copy(buffer, 0, pos, pos + len);
        pos += len;
        read += len;
    }

    return buffer;
}


function _readArray(dataBuffer) {

    const len = _readUVarInt(dataBuffer);
    if (len === ERROR)
        return ERROR;

    const result = [];

    for (let i = 0; i < len; i++) {
        const elem = _read(dataBuffer);
        if (elem === ERROR)
            return ERROR;

        result.push(elem);
    }

    return result;
}


function _readObj(dataBuffer) {

    const keyLen = _readUVarInt(dataBuffer);
    if (keyLen === ERROR)
        return ERROR;

    const result = {};

    for (let i = 0; i < keyLen; i++) {
        const keyName = _readString(dataBuffer, true /* isObjectKey */);
        if (keyName === ERROR)
            return ERROR;

        const value = _read(dataBuffer);
        if (value === ERROR)
            return ERROR;

        result[keyName] = value;
    }

    return result;
}