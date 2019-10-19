"use strict";

const deserializer = require('./service.bosDeserializer');


class BosDeserializeBuffer {

    get length() { return this._dataLen; }

    get nextReadLength() { return this._buffer ? deserializer.readSize(this._buffer) : 0; }

    get maxLength() { return this._maxLength; }
    set maxLength(len) {
        if (typeof len !== 'number')
            throw new Error(`Number expected. Got ${typeof len} instead.`);

        this._maxLength = len;
    }


    constructor(initialSize) {

        const _ = this;
        _._initialSize = initialSize;
        _._buffer = null;
        _._copyBuffer = null;
        _._dataLen = 0;
        _._maxLength = 10 * 1024;
    }


    /**
     * Append data from a Buffer.
     *
     * @param dataBuffer {Buffer}  The Buffer containing data to append.
     * @param [start=0]  {number}  The start index of the dataBuffer to append from.
     * @param [end]      {number}  The end index of the dataBuffer to stop appending from. (exclusive)
     *
     * @returns {boolean}  True if the data was appended. False if rejected because appending the data would cause the
     * buffer to be larger than the maxLength.
     */
    append(dataBuffer, start, end) {

        const _ = this;

        if (!Buffer.isBuffer(dataBuffer))
            throw new Error(`Buffer expected. Got ${typeof dataBuffer} instead.`);

        start = start || 0;
        end = end || dataBuffer.length;

        if (_._buffer && _._dataLen + (end - start) > _._maxLength)
            return false;

        _._buffer = _._ensureBufferSize(_._buffer, Math.max(_._initialSize || 0, _._dataLen + dataBuffer.length));
        dataBuffer.copy(_._buffer, _._dataLen, start, end);
        _._dataLen += end - start;
        return true;
    }


    /**
     * Read data in buffer and deserialize any complete objects into an output array.
     * Deserialized object data is removed from the buffer.
     *
     * @param outputArray {Array} Array to push deserialized data into.
     *
     * @returns {number}  The number of deserialized objects added to the output array.
     */
    deserialize(outputArray) {

        const _ = this;
        let pos = 0;
        let totalParsed = 0;

        while (deserializer.validate(_._buffer, pos, _._dataLen)) {

            const messageSize = deserializer.readSize(_._buffer, pos);

            if (messageSize > _._dataLen)
                throw new Error(`Unexpected: messageSize(${messageSize}) > dataLen(${_._dataLen})`);

            const parseError = _parseBos(_._buffer, pos, outputArray);
            if (parseError) {
                _._dataLen = 0;
                throw parseError;
            }

            pos += messageSize;
            _._dataLen -= messageSize;
            totalParsed++;
        }

        // move incomplete data to beginning of buffer
        if (_._dataLen > 0) {
            _._copyBuffer = _._ensureBufferSize(_._copyBuffer, _._dataLen);
            _._buffer.copy(_._copyBuffer, 0, pos, pos + _._dataLen);
            _._copyBuffer.copy(_._buffer, 0, 0, _._dataLen);
        }

        return totalParsed;
    }


    clear() {
        const _ = this;
        _._dataLen = 0;
    }


    toBuffer() {
        const _ = this;
        const newBuffer = Buffer.alloc(_._dataLen);
        _._buffer.copy(newBuffer);
        return newBuffer;
    }


    _ensureBufferSize(buffer, size) {

        const _ = this;

        if (!buffer || buffer.length < size) {
            const newBuffer = Buffer.alloc(Math.min(_._maxLength, Math.ceil(size * 1.25)));
            buffer && buffer.copy(newBuffer, 0);
            return newBuffer;
        }
        return buffer;
    }
}

module.exports = BosDeserializeBuffer;

function _parseBos(dataBuffer, start, outputArray) {
    try {
        const result = deserializer.deserialize(dataBuffer, start);
        outputArray.push(result);
        return false;
    } catch (e) {
        return e;
    }
}