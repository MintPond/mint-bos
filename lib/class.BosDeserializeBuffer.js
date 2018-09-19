"use strict";

const
    deserializer = require('./service.bosDeserializer');

module.exports = BosDeserializeBuffer;

function BosDeserializeBuffer(initialSize) {

    var buffer;
    var copyBuffer;
    var dataLen = 0;
    var maxLength = 10 * 1024;

    Object.defineProperties(this, {
        length: { get: function () { return dataLen; }},
        nextReadLength: {
            get: function () {
                return buffer ? deserializer.readSize(buffer) : 0;
            }
        },
        maxLength: {
            get: function () { return maxLength; },
            set: function (len) {
                if (typeof len !== 'number')
                    throw new Error('Number expected. Got ' + (typeof len) + ' instead.');
                maxLength = len;
            }
        }
    });

    this.append = append;

    this.deserialize = deserialize;

    this.clear = clear;

    this.toBuffer = toBuffer;

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
    function append(dataBuffer, start, end) {

        if (!Buffer.isBuffer(dataBuffer))
            throw new Error('Buffer expected. Got ' + (typeof dataBuffer) + ' instead.');

        start = start || 0;
        end = end || dataBuffer.length;

        if (buffer && dataLen + (end - start) > maxLength)
            return false;

        buffer = _ensureBufferSize(buffer, Math.max(initialSize || 0, dataLen + dataBuffer.length));
        dataBuffer.copy(buffer, dataLen, start, end);
        dataLen += end - start;
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
    function deserialize(outputArray) {

        var pos = 0;
        var totalParsed = 0;

        while (deserializer.validate(buffer, pos, dataLen)) {

            const messageSize = deserializer.readSize(buffer, pos);

            if (messageSize > dataLen)
                throw new Error('Unexpected: messageSize(' + messageSize + ') > dataLen(' + dataLen + ')');

            const parseError = _parseBos(buffer, pos, outputArray);
            if (parseError) {
                dataLen = 0;
                throw parseError;
            }

            pos += messageSize;
            dataLen -= messageSize;
            totalParsed++;
        }

        // move incomplete data to beginning of buffer
        if (dataLen > 0) {
            copyBuffer = _ensureBufferSize(copyBuffer, dataLen);
            buffer.copy(copyBuffer, 0, pos, pos + dataLen);
            copyBuffer.copy(buffer, 0, 0, dataLen);
        }

        return totalParsed;
    }

    function clear() {
        dataLen = 0;
    }

    function toBuffer() {
        const newBuffer = Buffer.alloc(dataLen);
        buffer.copy(newBuffer);
        return newBuffer;
    }

    function _ensureBufferSize(buffer, size) {

        if (!buffer || buffer.length < size) {
            const newBuffer = Buffer.alloc(Math.min(maxLength, Math.ceil(size * 1.25)));
            buffer && buffer.copy(newBuffer, 0);
            return newBuffer;
        }
        return buffer;
    }
}

function _parseBos(dataBuffer, start, outputArray) {
    try {
        const result = deserializer.deserialize(dataBuffer, start);
        outputArray.push(result);
        return false;
    } catch (e) {
        return e;
    }
}