# RelayDesk ITSM

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-selected: Next.js, NestJS, shadcn/ui, Zod, TypeORM, TanStack Query. TypeScript throughout. Database: PostgreSQL.

## Product Purpose

A substantial IT service management application, rather than a small CRUD example. Success means connected, persistent workflows that can be exercised through the UI and API.

## Capabilities and Constraints

The user's selected libraries must be used in real application flows. Keep backend Model / Repository / Service / Controller boundaries. Use a separate GitHub repository and meaningful incremental commits with PR publication, consistent with the user's standing preferences. Keep the interface focused on the IT service workflows.

## Open Decisions and Working Assumptions

The audience question is pending. The announced working assumption is internal IT support: employees submit incidents and service requests; agents triage; administrators manage access and approvals. The proposed feature scope includes SLA clocks, assignment, internal notes, audit history, asset inventory, knowledge articles and change approvals. The name RelayDesk is an implementation choice, not an existing customer or brand claim.

## Evidence on Hand

No customer data, existing ITSM source, testimonials or performance claims were provided. Any seeded people, tickets and organisations are explicitly fictional demonstration records.

## Product Principles

- Authorisation is enforced by the API, including record-level visibility.
- Mutations persist in PostgreSQL and update connected views.
- Validation is shared through Zod contracts.
- SLA and approval rules are explicit and testable.
