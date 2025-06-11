-- Restaurant Revenue Rocket - Database Schemas for Agentic AI Framework
-- This file defines the PostgreSQL schemas for storing AI decision logs, simulation states, and outcome metrics.
-- These schemas ensure data is timestamped and linked to specific scenarios/users for traceability.

-- Schema for AI Decision Logs
-- Stores detailed records of each AI decision made during simulations or real-time operations.
CREATE TABLE IF NOT EXISTS ai_decision_logs (
    id SERIAL PRIMARY KEY,
    decision_type VARCHAR(100) NOT NULL, -- e.g., 'inventory-management', 'dynamic-pricing', 'staffing-optimization'
    decision_data JSONB NOT NULL, -- Stores the full decision details in JSON format (e.g., items ordered, price adjustments)
    decision_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scenario_id VARCHAR(50), -- Links to a specific scenario or simulation run
    user_id VARCHAR(50), -- Links to a specific user or demo session
    outcome_metrics JSONB, -- Stores immediate outcomes or metrics post-decision (e.g., revenue impact if available)
    rationale TEXT, -- Explanation or reasoning behind the AI decision
    CONSTRAINT valid_decision_type CHECK (decision_type IN ('inventory-management', 'dynamic-pricing', 'staffing-optimization', 'customer-service', 'menu-optimization'))
);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_timestamp ON ai_decision_logs (decision_timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_scenario ON ai_decision_logs (scenario_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_user ON ai_decision_logs (user_id);

-- Schema for Simulation States
-- Captures the state of a simulation at a specific point in time (e.g., daily state during a multi-day simulation).
CREATE TABLE IF NOT EXISTS simulation_states (
    id SERIAL PRIMARY KEY,
    simulation_id VARCHAR(50) NOT NULL, -- Unique identifier for a simulation run
    day INTEGER NOT NULL, -- Simulation day or time step
    state_data JSONB NOT NULL, -- Full state in JSON format (e.g., inventory levels, revenue, customer satisfaction)
    state_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scenario_id VARCHAR(50), -- Links to a specific scenario type (e.g., fine dining, quick service)
    user_id VARCHAR(50), -- Links to a specific user or demo session
    CONSTRAINT unique_simulation_day UNIQUE (simulation_id, day)
);
CREATE INDEX IF NOT EXISTS idx_simulation_states_simulation ON simulation_states (simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_states_day ON simulation_states (day);
CREATE INDEX IF NOT EXISTS idx_simulation_states_scenario ON simulation_states (scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_states_user ON simulation_states (user_id);

-- Schema for Outcome Metrics
-- Stores aggregated or detailed metrics resulting from AI decisions and simulation runs for analysis and feedback loops.
CREATE TABLE IF NOT EXISTS outcome_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL, -- e.g., 'revenue', 'customer-satisfaction', 'waste-reduction', 'inventory-efficiency'
    metric_value NUMERIC(15, 4) NOT NULL, -- Quantitative value of the metric
    metric_details JSONB, -- Additional details or breakdowns in JSON format (e.g., revenue per item)
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    simulation_id VARCHAR(50), -- Links to a specific simulation run
    decision_id INTEGER REFERENCES ai_decision_logs(id) ON DELETE SET NULL, -- Links to a specific AI decision if applicable
    scenario_id VARCHAR(50), -- Links to a specific scenario
    user_id VARCHAR(50), -- Links to a specific user or demo session
    day INTEGER -- Simulation day or time step, if applicable
);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_timestamp ON outcome_metrics (metric_timestamp);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_simulation ON outcome_metrics (simulation_id);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_decision ON outcome_metrics (decision_id);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_scenario ON outcome_metrics (scenario_id);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_user ON outcome_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_metrics_day ON outcome_metrics (day);

-- Schema for User Sessions
-- Tracks user or demo sessions for linking decisions and simulations to specific interactions.
CREATE TABLE IF NOT EXISTS user_sessions (
    user_id VARCHAR(50) PRIMARY KEY,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    session_data JSONB, -- Additional session details (e.g., user type, demo settings)
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions (session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_end ON user_sessions (session_end);

-- Schema for Scenario Configurations
-- Stores configurations for different restaurant scenarios used in simulations.
CREATE TABLE IF NOT EXISTS scenario_configurations (
    scenario_id VARCHAR(50) PRIMARY KEY,
    scenario_name VARCHAR(100) NOT NULL, -- e.g., 'Fine Dining', 'Quick Service'
    configuration_data JSONB NOT NULL, -- Scenario-specific settings (e.g., AI behavior parameters, initial state)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scenario_configurations_name ON scenario_configurations (scenario_name);

-- Comments for Documentation
COMMENT ON TABLE ai_decision_logs IS 'Stores records of AI decisions made during simulations or operations, linked to scenarios and users for traceability.';
COMMENT ON COLUMN ai_decision_logs.decision_data IS 'JSONB field storing detailed decision data, such as items ordered or price adjustments.';
COMMENT ON TABLE simulation_states IS 'Captures periodic states of simulations, allowing reconstruction of simulation progress over time.';
COMMENT ON COLUMN simulation_states.state_data IS 'JSONB field storing the full simulation state at a given day or time step.';
COMMENT ON TABLE outcome_metrics IS 'Records metrics resulting from AI decisions and simulations for analysis and feedback loops.';
COMMENT ON COLUMN outcome_metrics.metric_details IS 'JSONB field for additional metric breakdowns or context.';
COMMENT ON TABLE user_sessions IS 'Tracks user or demo sessions to associate decisions and simulations with specific interactions.';
COMMENT ON TABLE scenario_configurations IS 'Stores configuration data for different restaurant scenarios used in the demo framework.';

-- Ensure data integrity with a trigger to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scenario_configurations_timestamp
    BEFORE UPDATE ON scenario_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_sessions_timestamp
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Initial Data for Scenario Configurations (placeholders for demo scenarios)
INSERT INTO scenario_configurations (scenario_id, scenario_name, configuration_data)
VALUES
    ('fine-dining-001', 'Fine Dining', '{"ai_behavior": {"priority": "customer_experience", "decision_weights": {"satisfaction": 0.6, "revenue": 0.3, "cost": 0.1}}, "initial_state": {"inventory": {"Steak": {"quantity": 10, "unit": "kg"}, "Wine": {"quantity": 50, "unit": "bottles"}}, "staff": 6, "menu_prices": {"Steak Dinner": 45.00, "Wine Glass": 12.00}, "customer_satisfaction": 0.9}}')
    ON CONFLICT (scenario_id) DO NOTHING;

INSERT INTO scenario_configurations (scenario_id, scenario_name, configuration_data)
VALUES
    ('quick-service-001', 'Quick Service', '{"ai_behavior": {"priority": "speed", "decision_weights": {"speed": 0.5, "cost": 0.3, "revenue": 0.2}}, "initial_state": {"inventory": {"Burger Patties": {"quantity": 20, "unit": "kg"}, "Fries": {"quantity": 15, "unit": "kg"}}, "staff": 4, "menu_prices": {"Burger Combo": 8.99, "Fries": 2.99}, "customer_satisfaction": 0.75}}')
    ON CONFLICT (scenario_id) DO NOTHING;

-- End of Schema Definition
