# Current Sprint: Unit Testing Foundation

**Status**: 🧪 TESTING SPRINT - Building Comprehensive Test Coverage
**Current Story**: Implement unit testing framework and write tests for critical functionality
**Active Branch**: `feature/unit-testing-setup`

## Testing Strategy & Task Breakdown:
- [ ] Task 1: Testing Framework Setup (Test Engineer) **← CURRENT**
  - **Branch**: `feature/unit-testing-setup`
  - Setup Jest + React Testing Library + TypeScript configuration
  - Configure test environment with Next.js App Router support
  - Setup database mocking and API mocking strategies
  - Create test utilities and helper functions
- [ ] Task 2: Service Layer Tests (Backend Test Specialist)
  - **Branch**: `feature/service-layer-tests`
  - WatchlistService: add, remove, get, update operations
  - TokenService: search, token fetching, pool operations
  - Database integration tests with SQLite in-memory
  - Error handling and edge case coverage
- [ ] Task 3: API Route Tests (Full-stack Test Specialist)
  - **Branch**: `feature/api-route-tests`
  - /api/watchlist endpoints (GET, POST, DELETE, PATCH)
  - /api/tokens search and market data endpoints
  - Request validation and error response testing
  - Integration with service layer verification
- [ ] Task 4: Component Unit Tests (Frontend Test Specialist)
  - **Branch**: `feature/component-tests`
  - TokenSearch: search logic, dropdown behavior, navigation
  - TokenDetails: add/remove buttons, state management
  - WatchlistView: list rendering, click navigation
  - Critical user interaction flows
- [ ] Task 5: RTK Query Integration Tests (State Management Specialist)
  - **Branch**: `feature/rtk-query-tests`
  - Mutation hooks: add/remove watchlist operations
  - Query hooks: data fetching and cache behavior
  - Error handling and loading states
  - Manual refetch functionality verification
- [ ] Task 6: End-to-End Critical Path Tests (QA Specialist)
  - **Branch**: `feature/integration-tests`
  - Complete add token to watchlist flow
  - Complete remove token from watchlist flow
  - Search → View Details → Add/Remove workflow
  - Error scenarios and edge cases

## Testing Priorities (High to Low):
1. **Critical Business Logic** - WatchlistService, TokenService core methods
2. **API Endpoints** - All /api routes with proper request/response validation
3. **User Interactions** - Add/remove buttons, search, navigation
4. **Data Flow** - RTK Query mutations and state updates
5. **Error Handling** - API failures, database errors, validation failures
6. **Edge Cases** - Duplicate adds, removing non-existent items, invalid tokens

## Testing Tools & Framework:
**Primary Stack**:
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing with user-centric approach
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **@types/jest**: TypeScript support for Jest

**Database Testing**:
- **SQLite in-memory**: Fast, isolated database tests
- **Jest setup/teardown**: Clean test environment for each test

**Mocking Strategy**:
- **Jupiter API**: Mock external API calls with MSW
- **File system**: Mock database file operations
- **RTK Query**: Test with mocked API responses

## Test Structure:
```
src/
├── __tests__/
│   ├── setup/
│   │   ├── jest.setup.ts
│   │   ├── test-utils.tsx
│   │   └── mocks/
│   ├── services/
│   │   ├── watchlist.service.test.ts
│   │   └── token.service.test.ts
│   ├── api/
│   │   ├── watchlist.api.test.ts
│   │   └── tokens.api.test.ts
│   ├── components/
│   │   ├── TokenSearch.test.tsx
│   │   ├── TokenDetails.test.tsx
│   │   └── WatchlistView.test.tsx
│   └── integration/
│       └── watchlist-flow.test.ts
├── jest.config.js
└── jest.setup.js
```

## Learning Approach:
**For First-Time Unit Testing**:
1. **Start Simple**: Begin with pure function tests (service methods)
2. **Learn Patterns**: Arrange-Act-Assert pattern, mocking concepts
3. **Build Complexity**: Move from unit → integration → component tests
4. **Focus on Value**: Test behavior users care about, not implementation details

**Testing Philosophy**:
- **Test behavior, not implementation** - Focus on what users experience
- **Write tests that prevent regressions** - Cover critical functionality
- **Keep tests simple and readable** - Tests are documentation
- **Mock external dependencies** - Jupiter API, file system, network calls

## Success Criteria:
- [ ] **80%+ test coverage** on service layer methods
- [ ] **All API routes tested** with request/response validation
- [ ] **Critical user flows covered** - add/remove watchlist operations
- [ ] **CI/CD ready** - Tests run automatically on commits
- [ ] **Learning complete** - Understanding of testing patterns and best practices

## Next Session Instructions:
**Role to assume**: Test Engineer (Testing Framework Specialist)
**Task**: Setup Jest + React Testing Library with Next.js 15 configuration
**Learning goal**: Understand testing setup, writing first tests, and mocking strategies