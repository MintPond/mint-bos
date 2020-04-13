'use strict';

const
    precon = require('@mintpond/mint-precon'),
    BufferSizeRingBuffer = require('./class.BufferSizeRingBuffer'),
    deserializer = require('./service.bosDeserializer');

const BUFFER_SIZE_RING_CAPACITY = 50;
let copyBuffer = null;


class BosDeserializeBuffer {

    /**
     * Constructor.
     *
     * @param initialSize {number}
     */
    constructor(initialSize) {
        precon.positiveInteger(initialSize, 'initialSize');

        const _ = this;
        _._initialSize = initialSize;
        _._buffer = null;
        _._dataLen = 0;
        _._maxLength = 0;
        _._limits = {
            maxDepth: 0,
            maxBytesTypeLen: 0
        };
        _._canShrink = false;
        _._sizeBuffer = null;

        _._chunkTimesMsArr = [];
    }


    /**
     * Get the current capacity of the buffer.
     * @returns {number}
     */
    get capacity() { return this._buffer ? this._buffer.length : this._initialSize; }

    /**
     * Get the length of the data in the buffer.
     * @returns {number}
     */
    get length() { return this._dataLen; }

    /**
     * Get the length of the next message in the buffer according to the data in the buffer.
     * @returns {number}
     */
    get nextReadLength() {
        return this._buffer ? deserializer.readSize(this._buffer) : 0;
    }

    /**
     * Get the maximum length of data in the buffer.
     * @returns {number}
     */
    get maxLength() { return this._maxLength; }
    set maxLength(len) {
        precon.positiveInteger(len, 'maxLength');
        this._maxLength = len;
    }

    /**
     * Get the maximum recursive depth allowed in a message.
     * @returns {number}
     */
    get maxDepth() { return this._limits.maxDepth; }
    set maxDepth(depth) {
        precon.positiveInteger(depth, 'maxDepth');
        this._limits.maxDepth = depth;
    }

    /**
     * Get the maximum number of bytes allowed in the Bytes data type. 0 indicates unlimited.
     * @returns {number}
     */
    get maxBytesTypeLen() { return this._limits.maxBytesTypeLen; }
    set maxBytesTypeLen(max) {
        precon.positiveInteger(max, 'maxBytesTypeLen');
        this._limits.maxBytesTypeLen = max;
    }

    /**
     * Determine if the buffer can shrink itself.
     * @returns {boolean}
     */
    get canShrink() { return this._canShrink; }
    set canShrink(canShrink) {
        precon.boolean(canShrink, 'canShrink');

        const _ = this;
        if (_._canShrink !== !!canShrink) {
            _._canShrink = !!canShrink;
            if (canShrink && !_._sizeBuffer) {
                _._sizeBuffer = new BufferSizeRingBuffer(BUFFER_SIZE_RING_CAPACITY);
            }
            else if (!canShrink) {
                _._sizeBuffer = null;
            }
        }
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
            throw new Error(`Buffer expected. Got ${(typeof dataBuffer)} instead.`);

        start = start || 0;
        end = end || dataBuffer.length;

        const chunkLen = end - start;

        if (_._maxLength && _._dataLen + chunkLen > _._maxLength)
            return false;

        _._buffer = BosDeserializeBuffer._ensureBufferSize(
            _._buffer, Math.max(_._initialSize || 0, _._dataLen + dataBuffer.length), _._maxLength, _._sizeBuffer);

        dataBuffer.copy(_._buffer, _._dataLen, start, end);
        _._dataLen += chunkLen;

        _._chunkTimesMsArr.push(Date.now(), _._dataLen/* buffer end*/);

        return true;
    }


    /**
     * Read data in buffer and deserialize any complete objects into an output array.
     * Deserialized object data is removed from the buffer.
     *
     * @param outputArray    {Array}    Array to push deserialized data into.
     * @param errOutputArray {string[]} An array to push error messages to.
     *
     * @returns {number|undefined} The number of deserialized objects added to the output array or undefined
     * if there is an error.
     */
    deserialize(outputArray, errOutputArray) {

        const _ = this;
        let pos = 0;
        let totalParsed = 0;

        _._sizeBuffer && _._sizeBuffer.add(_._dataLen);

        while (deserializer.validate(_._buffer, pos, _._dataLen)) {

            const messageSize = deserializer.readSize(_._buffer, pos);
            const result = deserializer.deserialize(_._buffer, pos, _._limits, errOutputArray);
            if (result === undefined) {
                _._dataLen = 0;
                _._chunkTimesMsArr.length = 0;
                return undefined;
            }

            const startTimeMs = _._chunkTimesMsArr[0/*addTimeMs*/] || Date.now();

            if (result && typeof result === 'object')
                result._bufferTimeMs = Date.now() - startTimeMs;

            outputArray.push(result);
            pos += messageSize;
            _._dataLen -= messageSize;
            totalParsed++;

            if (_._dataLen > 0) {
                let timeDiscardLen = 0;
                while (_._chunkTimesMsArr[1/*bufferEnd*/] <= pos && timeDiscardLen < _._chunkTimesMsArr.length) {
                    timeDiscardLen += 2;
                }

                if (timeDiscardLen)
                    _._chunkTimesMsArr.splice(0, timeDiscardLen);
            }
        }

        // move incomplete data to beginning of buffer
        if (_._dataLen > 0) {
            copyBuffer = BosDeserializeBuffer._ensureBufferSize(copyBuffer, _._dataLen, _._maxLength);
            _._buffer.copy(copyBuffer, 0, pos, pos + _._dataLen);
            copyBuffer.copy(_._buffer, 0, 0, _._dataLen);
        }
        else {
            _._chunkTimesMsArr.length = 0;
        }

        return totalParsed;
    }


    /**
     * Clear data from the buffer.
     */
    clear() {
        const _ = this;
        _._dataLen = 0;
        _._chunkTimesMsArr.length = 0;
    }


    /**
     * Create a new Buffer instance with a copy of the data in the BosDeserializeBuffer.
     *
     * @param [len] {number} The length of the Buffer to return. Default is the length of the data.
     * @returns {Buffer}
     */
    toBuffer(len) {
        precon.opt_positiveInteger(len, 'len');

        const _ = this;
        const newBuffer = Buffer.alloc(len ? Math.min(len, _._buffer.length) : _._dataLen);
        _._buffer.copy(newBuffer);
        return newBuffer;
    }


    /**
     * Read a byte from the buffer.
     *
     * @param pos {number} The position to read from.
     * @returns {number}
     */
    readUInt8(pos) {
        precon.positiveInteger(pos, 'pos');

        const _ = this;
        return _._buffer.readUInt8(pos);
    }


    /**
     * Read a 2-bytes from the buffer.
     *
     * @param pos {number} The position to read from.
     * @returns {number}
     */
    readUInt16LE(pos) {
        precon.positiveInteger(pos, 'pos');

        const _ = this;
        return _._buffer.readUInt16LE(pos);
    }

    /**
     * Read 4-bytes from the buffer.
     *
     * @param pos {number} The position to read from.
     * @returns {number}
     */
    readUInt32LE(pos) {
        precon.positiveInteger(pos, 'pos');

        const _ = this;
        return _._buffer.readUInt32LE(pos);
    }


    static _ensureBufferSize(buffer, size, maxLength, sizeBuffer) {

        if (!buffer || buffer.length < size) {

            const newSize = maxLength
                ? Math.min(maxLength, Math.ceil(size * 1.25))
                : Math.ceil(size * 1.25);

            if (sizeBuffer)
                sizeBuffer.clear();

            const newBuffer = Buffer.alloc(newSize);

            buffer && buffer.copy(newBuffer, 0);
            return newBuffer;
        }
        else if (buffer && sizeBuffer && sizeBuffer.isFull) {

            const maxSize = Math.ceil(sizeBuffer.getMax() * 1.25);

            if (maxSize > size && maxSize < buffer.length) {

                // shrink buffer
                const newBuffer = Buffer.alloc(
                    maxLength
                        ? Math.min(maxLength, maxSize)
                        : maxSize);

                buffer.copy(newBuffer, 0);

                sizeBuffer.clear();
                return newBuffer;
            }
            else {
                sizeBuffer.clear();
            }
        }
        return buffer;
    }


    static _parseBos(dataBuffer, start, limits, outputArray, errOutputArray) {

        const result = deserializer.deserialize(dataBuffer, start, limits, errOutputArray);
        if (result === undefined)
            return false;

        outputArray.push(result);
        return true;
    }
}

module.exports = BosDeserializeBuffer;