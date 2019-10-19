
const DataType = {};

Object.defineProperties(DataType, {

    NULL:    { value: 0x00, enumerable: true },
    BOOL:    { value: 0x01, enumerable: true },
    INT8:    { value: 0x02, enumerable: true },
    INT16:   { value: 0x03, enumerable: true },
    INT32:   { value: 0x04, enumerable: true },
    INT64:   { value: 0x05, enumerable: true },
    UINT8:   { value: 0x06, enumerable: true },
    UINT16:  { value: 0x07, enumerable: true },
    UINT32:  { value: 0x08, enumerable: true },
    UINT64:  { value: 0x09, enumerable: true },
    FLOAT:   { value: 0x0A, enumerable: true },
    DOUBLE:  { value: 0x0B, enumerable: true },
    STRING:  { value: 0x0C, enumerable: true },
    BYTES:   { value: 0x0D, enumerable: true },
    ARRAY:   { value: 0x0E, enumerable: true },
    OBJ:     { value: 0x0F, enumerable: true },

    isValid: { value: isValid },
    isSame: { value: isSame },
    isNumber: { value: isNumber },
    getType: { value: getType },
    isNull: { value: isNull },
    isSerializable: { value: isSerializable }
});

module.exports = DataType;

function isValid(dataType) {
    return dataType >= 0x00 && dataType <= 0x0F;
}

function isSame(typeA, typeB) {
    if (typeA === DataType.NULL || typeB === DataType.NULL)
        return true;
    if (isNumber(typeA))
        return isNumber(typeB);
    return typeA === typeB;
}

function isNumber(dataType) {
    switch (dataType) {
        case DataType.INT8:
        case DataType.INT16:
        case DataType.INT32:
        case DataType.UINT8:
        case DataType.UINT16:
        case DataType.UINT32:
        case DataType.FLOAT:
        case DataType.DOUBLE:
            return true;
        default:
            return false;
    }
}

function getType(obj) {

    if (isNull(obj))
        return DataType.NULL;

    if (typeof obj === 'string')
        return DataType.STRING;

    if (typeof obj === 'number') {
        if (Number.isInteger(obj)) {

            if (obj < 0) {

                if (obj >= -128)
                    return DataType.INT8;

                if (obj >= -32768)
                    return DataType.INT16;

                if (obj >= -2147483648)
                    return DataType.INT32;

                return DataType.INT32;
            }

            if (obj <= 255)
                return DataType.UINT8;

            if (obj <= 65535)
                return DataType.UINT16;

            if (obj <= 4294967295)
                return DataType.UINT32;

            return DataType.UINT32;
        } else {
            return DataType.DOUBLE;
        }
    }

    if (typeof obj === 'boolean')
        return DataType.BOOL;

    if (Array.isArray(obj))
        return DataType.ARRAY;

    if (Buffer.isBuffer(obj))
        return DataType.BYTES;

    if (typeof obj === 'object')
        return DataType.OBJ;

    throw new Error(`Invalid type: ${typeof obj}`);
}

function isNull(obj) {
    return obj === null || typeof obj === 'undefined';
}

function isSerializable(obj) {

    if (isNull(obj))
        return true;

    if (typeof obj === 'string')
        return true;

    if (typeof obj === 'number')
        return true;

    if (typeof obj === 'boolean')
        return true;

    if (Array.isArray(obj))
        return true;

    if (Buffer.isBuffer(obj))
        return true;

    return typeof obj === 'object';
}