# Documentation Index
## Context - Project Documentation

Welcome to the Context documentation! This directory contains all project documentation organized by purpose.

---

## 📋 Documentation Overview

### Core Documents

1. **[PRD.md](./PRD.md)** - Product Requirements Document
   - Product vision and goals
   - Feature specifications
   - User personas
   - MVP scope
   - Success metrics
   - **Start here if you want to understand what we're building**

2. **[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)** - Architecture & System Design
   - System architecture overview
   - Technology stack
   - Component design
   - AI processing pipeline
   - Security considerations
   - **Read this to understand how the system works**

3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database Schema Reference
   - Complete table definitions
   - Relationships and indexes
   - Functions and triggers
   - RLS policies
   - Migration strategy
   - **Reference for database structure**

4. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - REST API Documentation
   - All API endpoints
   - Request/response formats
   - Authentication
   - Error handling
   - **API reference for developers**

5. **[USER_FLOWS.md](./USER_FLOWS.md)** - User Journey Maps
   - Detailed user workflows
   - Step-by-step processes
   - Error handling flows
   - **Understand user experience and interactions**

6. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Development Setup Instructions
   - Prerequisites
   - Installation steps
   - Environment configuration
   - Common issues
   - **Get started with development**

7. **[ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)** - Technical Decision Records
   - ADR format documentation
   - Key technical decisions
   - Alternatives considered
   - Consequences and trade-offs
   - **Understand why technical choices were made**

---

## 🚀 Quick Start Guide

### For Product Managers / Stakeholders
1. Read **[PRD.md](./PRD.md)** to understand the product
2. Review **[USER_FLOWS.md](./USER_FLOWS.md)** to see user journeys

### For Developers
1. Read **[PRD.md](./PRD.md)** for context
2. Read **[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)** for architecture
3. Follow **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** to set up development environment
4. Reference **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** when building features
5. Check **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** for data model

### For Architects / Tech Leads
1. Review **[ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)** for technical rationale
2. Study **[TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)** for system design
3. Reference **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** for data architecture

---

## 📚 Document Relationships

```
PRD.md
  ├── Defines requirements for →
  │   ├── TECHNICAL_DESIGN.md (architecture decisions)
  │   ├── DATABASE_SCHEMA.md (data model)
  │   ├── API_SPECIFICATION.md (API endpoints)
  │   └── USER_FLOWS.md (user interactions)
  │
  └── Implemented by →
      └── SETUP_GUIDE.md (development setup)

ARCHITECTURE_DECISIONS.md
  └── Justifies decisions in →
      └── TECHNICAL_DESIGN.md
```

---

## 🔍 Finding Information

### I want to know...

**...what features are in the MVP?**
→ See [PRD.md - MVP Scope](./PRD.md#7-mvp-scope)

**...how authentication works?**
→ See [PRD.md - Authentication](./PRD.md#311-authentication--user-management) and [API_SPECIFICATION.md - Auth](./API_SPECIFICATION.md#authentication)

**...how the AI processing pipeline works?**
→ See [TECHNICAL_DESIGN.md - AI Pipeline](./TECHNICAL_DESIGN.md#3-ai-processing-pipeline)

**...what the database structure looks like?**
→ See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**...how to set up my development environment?**
→ See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**...what API endpoints are available?**
→ See [API_SPECIFICATION.md](./API_SPECIFICATION.md)

**...how a user uploads content?**
→ See [USER_FLOWS.md - Content Upload](./USER_FLOWS.md#3-content-upload--processing)

**...why we chose Next.js?**
→ See [ARCHITECTURE_DECISIONS.md - ADR-001](./ARCHITECTURE_DECISIONS.md#adr-001-nextjs-app-router)

---

## 📝 Document Maintenance

### Keeping Docs Updated

- **PRD.md:** Update when product requirements change
- **TECHNICAL_DESIGN.md:** Update when architecture changes
- **DATABASE_SCHEMA.md:** Update when schema changes (create migrations)
- **API_SPECIFICATION.md:** Update when API endpoints change
- **USER_FLOWS.md:** Update when user journeys change
- **SETUP_GUIDE.md:** Update when setup process changes
- **ARCHITECTURE_DECISIONS.md:** Add new ADR when making major technical decisions

### Version Control

All documentation is version-controlled. When making changes:
1. Update the "Date" field at the top of the document
2. Increment version if it's a major change
3. Update this README if document structure changes

---

## 📖 Additional Resources

- **Main README:** [../README.md](../README.md) - Project overview
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Linear API:** [developers.linear.app](https://developers.linear.app/docs)
- **OpenAI API:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **LangChain Docs:** [python.langchain.com](https://python.langchain.com/docs/get_started/introduction)

---

**Last Updated:** 2024
