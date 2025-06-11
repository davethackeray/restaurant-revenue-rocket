# Phase 1: Data Structures for Agentic AI Framework

## Overview
This document summarizes the work conducted on Days 11-12 of Phase 1 for the Agentic AI Demonstration Framework within "Restaurant Revenue Rocket." The focus is on planning data structures for storing AI decision history, scenario states, and user interactions. These structures are designed for use in PostgreSQL for persistent data storage and Redis for transient, fast-access data, ensuring scalability and data integrity to support real-time simulations and long-term analysis.

## Objectives
- Design database schemas for PostgreSQL to store persistent data such as AI decision history, scenario states over time, and user interactions for session logging and export.
- Define key-value structures for Redis to cache transient data, enabling low-latency access to active scenario states during demonstrations.
- Ensure scalability through indexing and optimized data retrieval strategies to handle multiple concurrent demo sessions.
- Maintain data integrity with relational constraints and validation rules to prevent inconsistencies in simulation data.

## Design Principles
The data structure design adheres to the Software Engineering (SWE) principles outlined in 'docs/phase1-research-design-progress.md', with a focus on:
- **Scalability**: Structures are optimized for growth in data volume and concurrent access, supporting multiple demo sessions.
- **Performance**: Data access patterns prioritize low-latency reads and writes, especially for real-time interactions using Redis caching.
- **Integrity**: Relational constraints and validation ensure consistency across related data entities in PostgreSQL.
- **Modularity**: Schemas are designed to allow future extensions (e.g., new decision types or metrics) without major refactoring.
- **User Impact**: Data storage supports demo export features and user analytics to enhance engagement and learning.

## Data Storage Strategy
The Agentic AI Framework employs a hybrid storage approach:
- **PostgreSQL**: Used for persistent storage of historical data, including AI decision logs, scenario state snapshots, and user interaction records. This ensures data durability for session exports, long-term analysis, and audit trails.
- **Redis**: Used for transient caching of active scenario states and frequently accessed data during demos. This provides low-latency access for real-time updates and interactions, reducing database load.

## PostgreSQL Schemas for Persistent Data

### 1. Scenarios Table
- **Purpose**: Stores metadata for each restaurant scenario simulation, serving as the parent entity for states and decisions.
- **Schema**:
  | Field Name          | Type          | Constraints                     | Description                                      |
  |---------------------|---------------|---------------------------------|--------------------------------------------------|
  | scenario_id         | UUID          | Primary Key                     | Unique identifier for the scenario.              |
  | profile_type        | VARCHAR(50)   | NOT NULL                        | Restaurant type (e.g., fine dining, quick service). |
  | start_time          | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Start time of the scenario simulation.       |
  | end_time            | TIMESTAMP     | NULL                            | End time of the scenario, if completed.          |
  | user_id             | UUID          | NULL                            | Identifier for the user running the demo, if tracked. |
  | created_at          | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp.                   |
- **Indexes**: 
  - Primary index on `scenario_id` for fast lookups.
  - Index on `start_time` and `end_time` for time-based queries (e.g., active scenarios).
- **Usage**: Links to state snapshots and decisions, enabling tracking of a scenario's full history.

### 2. Scenario States Table
- **Purpose**: Captures periodic snapshots of a scenario's operational state, reflecting variables like inventory or pricing at specific points in time.
- **Schema**:
  | Field Name          | Type          | Constraints                     | Description                                      |
  |---------------------|---------------|---------------------------------|--------------------------------------------------|
  | state_id            | UUID          | Primary Key                     | Unique identifier for the state snapshot.        |
  | scenario_id         | UUID          | Foreign Key (Scenarios)         | Links to the parent scenario.                    |
  | snapshot_time       | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Time of the state snapshot.                  |
  | inventory_data      | JSONB         | NOT NULL                        | JSON object with inventory levels (e.g., {"item1": 50}). |
  | pricing_data        | JSONB         | NOT NULL                        | JSON object with current prices (e.g., {"dish1": 12.99}). |
  | staffing_data       | JSONB         | NOT NULL                        | JSON object with staff schedules (e.g., {"shift1": 5 staff}). |
  | customer_satisfaction | FLOAT       | NULL                            | Metric for customer satisfaction (0-100 scale).  |
  | revenue             | DECIMAL(10,2) | NULL                            | Current revenue for the scenario snapshot.       |
  | simulation_day      | INTEGER       | NOT NULL                        | Simulated day/hour in the scenario timeline.     |
- **Indexes**: 
  - Primary index on `state_id` for fast lookups.
  - Composite index on `scenario_id` and `snapshot_time` for efficient historical state retrieval.
- **Usage**: Stores state changes over time, allowing reconstruction of scenario progression for analysis or export. JSONB fields provide flexibility for varying data structures across restaurant types.

### 3. AI Decisions Table
- **Purpose**: Logs each decision made by the AI agent, including rationale and outcomes, for historical tracking and feedback analysis.
- **Schema**:
  | Field Name          | Type          | Constraints                     | Description                                      |
  |---------------------|---------------|---------------------------------|--------------------------------------------------|
  | decision_id         | UUID          | Primary Key                     | Unique identifier for the decision.              |
  | scenario_id         | UUID          | Foreign Key (Scenarios)         | Links to the parent scenario.                    |
  | state_id            | UUID          | Foreign Key (Scenario States)   | Links to the state snapshot at decision time.    |
  | decision_type       | VARCHAR(50)   | NOT NULL                        | Type of decision (e.g., inventory_order, pricing). |
  | decision_details    | JSONB         | NOT NULL                        | JSON object with decision specifics (e.g., {"item": "beef", "quantity": 100}). |
  | rationale           | TEXT          | NULL                            | Explanation of why the decision was made.        |
  | outcome_metrics     | JSONB         | NULL                            | Post-decision impact (e.g., {"revenue_change": 500}). |
  | decision_time       | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Time the decision was made.                  |
  | user_override       | BOOLEAN       | NOT NULL, DEFAULT FALSE         | Whether the user overrode this decision.         |
  | override_details    | JSONB         | NULL                            | Details of user override, if applicable.         |
- **Indexes**: 
  - Primary index on `decision_id` for fast lookups.
  - Composite index on `scenario_id` and `decision_time` for chronological decision tracking.
  - Index on `decision_type` for filtering by decision category.
- **Usage**: Enables detailed analysis of AI behavior, user interaction patterns, and decision effectiveness over time.

### 4. User Interactions Table
- **Purpose**: Records user actions during demos, such as overrides or feedback, to analyze engagement and refine AI behavior.
- **Schema**:
  | Field Name          | Type          | Constraints                     | Description                                      |
  |---------------------|---------------|---------------------------------|--------------------------------------------------|
  | interaction_id      | UUID          | Primary Key                     | Unique identifier for the interaction.           |
  | scenario_id         | UUID          | Foreign Key (Scenarios)         | Links to the parent scenario.                    |
  | decision_id         | UUID          | Foreign Key (AI Decisions)      | Links to the related AI decision, if applicable. |
  | interaction_type    | VARCHAR(50)   | NOT NULL                        | Type of interaction (e.g., override, feedback).  |
  | interaction_details | JSONB         | NOT NULL                        | JSON object with specifics (e.g., {"new_price": 10.99}). |
  | interaction_time    | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Time of the interaction.                     |
  | user_id             | UUID          | NULL                            | Identifier for the user, if tracked.             |
- **Indexes**: 
  - Primary index on `interaction_id` for fast lookups.
  - Composite index on `scenario_id` and `interaction_time` for session activity tracking.
- **Usage**: Captures user engagement data for demo improvement and to feed into the AI feedback loop for strategy adjustments.

## Redis Structures for Transient Data

### 1. Active Scenario State Cache
- **Purpose**: Stores the current state of active scenarios for low-latency access during real-time simulations.
- **Key Format**: `scenario:state:<scenario_id>`
- **Value Format**: Hash with fields for operational metrics:
  - `inventory_data`: JSON string of current inventory (e.g., {"item1": 50}).
  - `pricing_data`: JSON string of current prices (e.g., {"dish1": 12.99}).
  - `staffing_data`: JSON string of staff schedules (e.g., {"shift1": 5}).
  - `customer_satisfaction`: Float value (e.g., 85.5).
  - `revenue`: Float value (e.g., 2500.75).
  - `simulation_day`: Integer for current simulated time (e.g., 3).
- **TTL (Time-to-Live)**: Set to expire after a demo session timeout (e.g., 1 hour of inactivity) to free memory.
- **Usage**: Updated by the State Manager after each decision or time progression; read frequently by the Decision Engine and Interaction Handler for real-time updates.

### 2. Recent Decisions Cache
- **Purpose**: Caches recent AI decisions for quick reference in the UI or during feedback loops, reducing PostgreSQL queries.
- **Key Format**: `scenario:decisions:<scenario_id>`
- **Value Format**: List of JSON strings, each representing a decision (e.g., {"decision_id": "uuid", "type": "inventory_order", "details": {"item": "beef", "quantity": 100}}).
- **TTL**: Expires after session timeout or a fixed duration (e.g., 30 minutes) to keep only recent data.
- **Usage**: Pushed to by the Decision Engine after each decision; accessed by the Interaction Handler for displaying recent activity.

### 3. API Response Cache
- **Purpose**: Stores frequent or predictable Gemini API responses to minimize latency and API calls during demos.
- **Key Format**: `api:response:<hashed_prompt>`
- **Value Format**: JSON string of the API response (e.g., {"decision": "order 50 units", "rationale": "high demand predicted"}).
- **TTL**: Longer duration (e.g., 24 hours) for common prompts, refreshed if API parameters change.
- **Usage**: Checked by the Decision Engine before making API calls; updated with new responses to maintain freshness.

## Scalability and Performance Considerations
- **PostgreSQL Scalability**:
  - **Indexing**: All tables have primary and composite indexes on frequently queried fields (e.g., `scenario_id`, time fields) to speed up lookups and joins.
  - **Partitioning**: For large-scale deployments, consider partitioning the `Scenario States` and `AI Decisions` tables by `scenario_id` or date range to manage data growth.
  - **Archiving**: Implement archival strategies to move old scenario data to cold storage, keeping active tables lean for performance.
- **Redis Performance**:
  - **Memory Management**: Use TTLs aggressively to prevent memory bloat from inactive sessions.
  - **Key Naming**: Structured key formats (e.g., `scenario:state:<id>`) enable efficient key pattern matching for bulk operations if needed.
  - **Eviction Policies**: Configure Redis with an LRU (Least Recently Used) eviction policy to prioritize active demo data over stale cache entries.
- **Data Synchronization**: Ensure Redis and PostgreSQL stay in sync by writing persistent data to PostgreSQL first, then updating Redis cache. Use transaction blocks in PostgreSQL to maintain integrity during updates.

## Data Integrity Mechanisms
- **Relational Constraints**: Foreign key constraints in PostgreSQL ensure that states, decisions, and interactions are always linked to valid scenarios, preventing orphaned records.
- **Validation Rules**: Application-level checks before data insertion (e.g., ensuring inventory levels are non-negative) to avoid invalid states.
- **Timestamps**: Consistent use of `CURRENT_TIMESTAMP` for time fields ensures accurate chronological tracking, critical for state progression and decision history.
- **JSONB Flexibility**: Using JSONB for dynamic data (e.g., inventory, pricing) allows schema evolution without migrations, but with application-level validation to enforce structure.

## Addressing Identified Risks
Drawing from 'docs/phase1-risks-challenges-mitigation.md', the data structures mitigate risks:
- **Data Accuracy**: Validation at the application layer before storage prevents propagation of erroneous data into states or decisions.
- **Scalability**: Optimized indexing and caching strategies address performance bottlenecks for concurrent demo sessions.
- **Technical Limitations**: Redis caching reduces dependency on real-time database queries, while PostgreSQL ensures data persistence even during system interruptions.

## Conclusion
The planned data structures for the Agentic AI Framework in "Restaurant Revenue Rocket" provide a robust foundation for storing AI decision history, scenario states, and user interactions. PostgreSQL schemas ensure persistent, relational data storage for historical analysis and session exports, while Redis structures enable low-latency access to transient data during real-time demos. Scalability and integrity are prioritized through indexing, TTLs, and validation mechanisms, supporting the project's goal of demonstrating AI-driven restaurant management. This design will inform the technical specification document in the next Phase 1 task.

**Progress Note**: This completes the Day 11-12 task of planning data structures for the Agentic AI Framework. The schemas and caching strategies are designed for scalability and data integrity across PostgreSQL and Redis.

**Next Task**: Proceed to Day 13 task of drafting a technical specification document outlining the agentic AI framework's architecture, integration points, data flow, and required APIs.
