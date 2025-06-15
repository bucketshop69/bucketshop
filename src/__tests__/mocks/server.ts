// Use require for MSW in Jest environment
const { setupServer } = require('msw/node')
const { handlers } = require('./handlers')

// Setup MSW server for Node.js environment (Jest tests)  
const server = setupServer(...handlers)

// Configure server for test environment
export function setupMockServer() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn',
    })
  })

  // Reset handlers after each test to ensure test isolation
  afterEach(() => {
    server.resetHandlers()
  })

  // Clean up after all tests
  afterAll(() => {
    server.close()
  })
}

// Export for direct use in tests
export { server }