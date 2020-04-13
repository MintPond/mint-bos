'use strict';

const DataType = {
    get NULL() { return 0x00 },
    get BOOL() { return 0x01 },
    get INT8() { return 0x02 },
    get INT16() { return 0x03 },
    get INT32() { return 0x04 },
    get INT64() { return 0x05 },
    get UINT8() { return 0x06 },
    get UINT16() { return 0x07 },
    get UINT32() { return 0x08 },
    get UINT64() { return 0x09 },
    get FLOAT() { return 0x0A },
    get DOUBLE() { return 0x0B },
    get STRING() { return 0x0C },
    get BYTES() { return 0x0D },
    get ARRAY() { return 0x0E },
    get OBJ() { return 0x0F }
};

Object.defineProperties(DataType, {
    isValid: { value: isValid },
    isSame: { value: isSame },
    isNumber: { value: isNumber },
    getType: { value: getType },
    isNull: { value: isNull },
    isSerializable: { value: isSerializable }
});

module.exports = DataType;


/**
 * Determine if a data type value is valid.
 * @param dataType {number}
 * @returns {boolean}
 */
function isValid(dataType) {
    return dataType >= 0x00 && dataType <= 0x0F;
}


/**
 * Determine if two data types are the same.
 *
 * If either value is NULL, both value types are considered the same.
 *
 * If both value types represent a number type they are considered the same.
 *
 * @param typeA {number}
 * @param typeB {number}
 * @returns {boolean}
 */
function isSame(typeA, typeB) {
    if (typeA === DataType.NULL || typeB === DataType.NULL)
        return true;
    if (isNumber(typeA))
        return isNumber(typeB);
    return typeA === typeB;
}


/**
 * Determine if a data type represents a number.
 *
 * @param dataType {number}
 * @returns {boolean}
 */
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


/**
 * Get a data type value for an object.
 *
 * @param obj {*}
 * @returns {number}
 */
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

                return DataType.INT64;
            }

            if (obj <= 255)
                return DataType.UINT8;

            if (obj <= 65535)
                return DataType.UINT16;

            if (obj <= 4294967295)
                return DataType.UINT32;

            return DataType.UINT64;
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

    throw new Error(`'Invalid type: ${typeof obj}`);
}

/**
 * Determine if an object is null or undefined.
 *
 * @param obj {*}
 * @returns {boolean}
 */
function isNull(obj) {
    return obj === null || typeof obj === 'undefined';
}


/**
 * Determine if an object can be serialized.
 *
 * @param obj {*}
 * @returns {boolean}
 */
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