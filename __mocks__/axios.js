const mockAxios = {
  create: jest.fn(() => mockAxios),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      handlers: [],
    },
    response: {
      use: jest.fn(),
      handlers: [],
    },
  },
  defaults: {
    baseURL: '',
    timeout: 15000,
    headers: {},
  },
};

module.exports = mockAxios;
module.exports.default = mockAxios;
