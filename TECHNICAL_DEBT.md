# Technical Debt & Temporary Implementations

**Quick Reference** - See [docs/TECHNICAL_DEBT.md](./docs/TECHNICAL_DEBT.md) for full details.

## 🔴 Critical Issues

1. **Email Service Not Implemented** - Invitations not actually sent
2. **Missing Unit Tests** - No test coverage

## 🟡 Medium Priority

3. **Missing Features:** Upload Content, Export, Settings, Help
4. **Mock Folder Structure** - Hardcoded instead of database
5. **Console Logging** - Should use proper logging service
6. **Missing Error User Feedback** - Errors logged but not shown
7. **Rate Limiting** - No rate limits on invitations
8. **User Lookup Performance** - Loads all users then filters

## 🟢 Low Priority / Future

9. **Hardcoded Values** - Invitation expiration (7 days)
10. **Missing Features:** Ownership transfer, bulk invitations, resend invitations
11. **Code Quality:** Type safety, input validation, error handling consistency
12. **Performance:** Caching, pagination, query optimization
13. **Security:** CSRF protection, input sanitization
14. **Documentation:** API docs, component docs

**Total:** 31 items tracked

See [docs/TECHNICAL_DEBT.md](./docs/TECHNICAL_DEBT.md) for complete details, locations, and action items.
