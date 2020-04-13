mint-bos
========

BOS (Binary Object Serializer) is a lightweight NodeJS object serializer meant to allow transport
of JSON type data in binary format. It allows transporting large binary data more efficiently.

This module has been developed and tested on 
[Node v10.16.3](https://nodejs.org/) and 
[Ubuntu 16.04](http://releases.ubuntu.com/16.04/)

## Install ##
__Install as Dependency in NodeJS Project__
```bash
# Install from Github git package

sudo apt-get install build-essential
npm install mintpond/mint-bos --save
```
-or-
```bash
# Install from Github NPM repository

sudo apt-get install build-essential
npm config set @mintpond:registry https://npm.pkg.github.com/mintpond
npm config set //npm.pkg.github.com/:_authToken <MY_GITHUB_AUTH_TOKEN>

npm install @mintpond/mint-bos@2.0.0 --save
```

## Usage ##
__Serializer__
```js
const bos = require('@mintpond/mint-bos');

const obj = {
    name: "object1",
    number: 1.3,
    bool: true,
    array: ["string", 1, 2.3, false],
    obj: {
        str: "this is a string",
        num: 1,
        bool: true,
        array: [0]
    },
    buffer: Buffer.alloc(4, 1)
}

const bufferData = bos.serialize(obj);
```

__Deserializer__
```js
const bos = require('@mintpond/mint-bos');

if (bos.validate(bufferData, 0)) {
    const obj = bos.deserialize(bufferData, 0);
}

```

## Functions ##

### serialize(obj) ###

Serializes an object (`obj`) and returns a _Buffer_ with serialized data.

The object can be a string, number, boolean, object, array, null, or Buffer.
An object may contain any of the mentioned data types as well as functions,
however functions will not be serialized.

Circular references in an object will cause an exception to be thrown.

### validate(bufferData, start, dataLen) ###
Quickly validates serialized data by ensuring the supplied
_Buffer_ data (`bufferData`) is complete.

The optional `start` index is the index position in the `bufferData`
where the serialized data to validate begins. If the `start` index is
not supplied, the default value of _0_ is used.

The optional `dataLen` is the number of bytes after the start index to
consider for validation. If omitted or value is 0, the length of the
`dataBuffer` minus the start index is used.

Returns `true` if validated, otherwise `false` is returned.
A value of `true` does not guarantee that the data is valid.

### deserialize(bufferData, start) ###
Deserializes binary data in a _Buffer_ (`bufferData`) into a Javascript
value. (i.e. a serialized array is returned as an array).

The optional `start` index is the index position in the `bufferData` where
the data to deserialize begins. If the `start` index is not supplied, the
default value of _0_ is used.

Returns the deserialized javascript value.

### readSize(bufferData, start) ###
Read the size of serialized data in a buffer as specified by the
serialized data.

The optional `start` index is the index position in the `bufferData` where
the data to read begins. If the `start` index is not supplied, the
default value of _0_ is used.

Returns the size of the serialized data or -1 if the data isn't valid.
(Receiving a size value does not guarantee that the data is valid)

## Binary Format ##
See the separate document detailing the [binary format](FORMAT.md).