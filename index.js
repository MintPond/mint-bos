const BosDeserializeBuffer = require('./lib/class.BosDeserializeBuffer');
const serializer = require('./lib/service.bosSerializer');
const deserializer = require('./lib/service.bosDeserializer');

module.exports = {
    serialize: serializer.serialize,
    deserialize: deserializer.deserialize,
    validate: deserializer.validate,
    readSize: deserializer.readSize,
    BosDeserializeBuffer: BosDeserializeBuffer,
    DataType: require('./lib/const.DataType')
};