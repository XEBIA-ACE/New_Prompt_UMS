# AGENTS.md

## Stack

- **Service:** User Management Service
- **Type:** business
- **Technologies:**
- Node.js
- Express
- PostgreSQL
- **Responsibilities:**
- User registration and management
- OTP handling and verification
- User authentication
- Account deletion

## General Rules

- Always read files in /specs before implementing
- Never implement without acceptance criteria
- Code should be simple and readable
- Avoid overengineering
- The project follows a hexagonal architecture

## Required Workflow

1. Read the specs in the /specs directory
2. Generate tasks.md if it does not exist
3. Implement based on the tasks
4. Create automated tests
5. Validate acceptance criteria

## Testing

- Cover all acceptance criteria
- Tests should be clear and straightforward
- Generated code must reach **90% unit test coverage**

## Constraints

- Do not invent requirements that are not described
- Do not change behavior without updating the spec
