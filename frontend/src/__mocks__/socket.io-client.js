const createMockSocket = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  off: jest.fn(),
});

const mockSocket = createMockSocket();

const io = jest.fn(() => mockSocket);

module.exports = io;
module.exports.io = io;
module.exports.Socket = class Socket {};

module.exports.default = io;
