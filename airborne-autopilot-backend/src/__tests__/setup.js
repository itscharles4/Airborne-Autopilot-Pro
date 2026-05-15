// Setup file for Jest tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/airborne_autopilot_test';
  process.env.JWT_SECRET = 'test_secret_key';
});

afterAll(async () => {
  jest.setTimeout(10000);
});
