'use strict';

const precon = require('@mintpond/mint-precon');


class BufferSizeRingBuffer {

    /**
     * Constructor.
     *
     * @param capacity {number} The maximum capacity of the buffer.
     */
    constructor (capacity) {
        precon.positiveInteger(capacity, 'capacity');

        const _ = this;
        _._capacity = capacity;
        _._buffer = Array(capacity);
        _._nextIndex = 0;
        _._len = 0;
    }


    /**
     * Get the size of the buffer (number of entries)
     * @returns {number}
     */
    get size() { return this._len; }

    /**
     * Get the maximum capacity of the buffer.
     * @returns {number}
     */
    get capacity() { return this._capacity; }

    /**
     * Determine if the buffer is full.
     * @returns {boolean}
     */
    get isFull() { return this._len === this._capacity; }


    /**
     * Get the largest value in the buffer.
     * @returns {number}
     */
    getMax() {

        const _ = this;

        if (_._len === 0)
            return 0;

        let max = 0;

        if (_.isFull) {

            for (let i = 0; i < _._buffer.length; i++) {
                max = Math.max(max, _._buffer[i]);
            }
        }
        else {

            for (let i = _._len - 1, index = _._nextIndex - 1; i >= 0; i--, index--) {

                if (index < 0)
                    index = _._buffer.length - 1;

                max = Math.max(max, _._buffer[index]);
            }
        }

        return max;
    }


    /**
     * Add a size value to the buffer.
     * @param size {number}
     */
    add(size) {
        precon.positiveInteger(size, 'size');

        const _ = this;

        if (_._len < _._capacity)
            _._len++;

        _._buffer[_._nextIndex] = size;
        _._nextIndex = (_._nextIndex + 1) % _._capacity;
    }


    /**
     * Clear all entries from the buffer.
     */
    clear() {
        const _ = this;
        _._nextIndex = 0;
        _._len = 0;
    }
}

module.exports = BufferSizeRingBuffer;