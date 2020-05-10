exports.fixServerAddress = function ({ address, port, family }) {
  return { ip: address == '::' ? '127.0.0.1' : address, port, family };
}
