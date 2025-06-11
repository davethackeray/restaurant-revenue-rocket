// Restaurant Revenue Rocket - Backend API Endpoints
// This module defines Express API endpoints for triggering AI decisions, running simulations, and retrieving decision logs or simulation results.
// Endpoints are designed to be secure and performant for real-time demo interactions.

const express = require('express');
const router = express.Router();
const SimulationEngine = require('./simulation-engine');
const { processDecision } = require('./ai-decision-module');
const { loadDemoProfiles, applyAIBehaviorParameters } = require('./profile-loader');

// Load demo profiles on startup
const profiles = loadDemoProfiles();
const { 
  cacheSimulationState, 
  getCachedSimulationState, 
  invalidateCachedSimulationState,
  cacheScenarioConfiguration,
  getCachedScenarioConfiguration
} = require('./redis-cache');

// Placeholder for database interactions (to be implemented with PostgreSQL)
const db = {
  logDecision: async (decisionType, decisionData, scenarioId, userId, outcomeMetrics, rationale) => {
    console.log(`Logging AI Decision: ${decisionType} for scenario ${scenarioId || 'N/A'} by user ${userId || 'N/A'}`);
    // Placeholder: In a real implementation, insert into ai_decision_logs table
    return { id: Date.now(), decisionType, decisionData, scenarioId, userId, outcomeMetrics, rationale };
  },
  saveSimulationState: async (simulationId, day, stateData, scenarioId, userId) => {
    console.log(`Saving Simulation State for simulation ${simulationId}, day ${day}`);
    // Placeholder: In a real implementation, insert into simulation_states table
    return { id: Date.now(), simulationId, day, stateData, scenarioId, userId };
  },
  saveOutcomeMetric: async (metricType, metricValue, metricDetails, simulationId, decisionId, scenarioId, userId, day) => {
    console.log(`Saving Outcome Metric: ${metricType} = ${metricValue} for simulation ${simulationId || 'N/A'}`);
    // Placeholder: In a real implementation, insert into outcome_metrics table
    return { id: Date.now(), metricType, metricValue, metricDetails, simulationId, decisionId, scenarioId, userId, day };
  },
  getDecisionLogs: async (scenarioId, userId, limit = 50) => {
    console.log(`Retrieving Decision Logs for scenario ${scenarioId || 'N/A'}, user ${userId || 'N/A'}`);
    // Placeholder: In a real implementation, query ai_decision_logs table
    return [];
  },
  getSimulationStates: async (simulationId, userId) => {
    console.log(`Retrieving Simulation States for simulation ${simulationId}, user ${userId || 'N/A'}`);
    // Placeholder: In a real implementation, query simulation_states table
    return [];
  },
  getOutcomeMetrics: async (simulationId, metricType, userId) => {
    console.log(`Retrieving Outcome Metrics for simulation ${simulationId || 'N/A'}, type ${metricType || 'N/A'}`);
    // Placeholder: In a real implementation, query outcome_metrics table
    return [];
  },
  getScenarioConfiguration: async (scenarioId) => {
    console.log(`Retrieving Scenario Configuration for scenario ${scenarioId}`);
    // Placeholder: In a real implementation, query scenario_configurations table
    const mockConfigurations = {
      'fine-dining-001': {
        scenario_id: 'fine-dining-001',
        scenario_name: 'Fine Dining',
        configuration_data: {
          ai_behavior: { priority: 'customer_experience', decision_weights: { satisfaction: 0.6, revenue: 0.3, cost: 0.1 } },
          initial_state: { 
            inventory: { 'Steak': { quantity: 10, unit: 'kg' }, 'Wine': { quantity: 50, unit: 'bottles' } },
            staff: 6, 
            menu_prices: { 'Steak Dinner': 45.00, 'Wine Glass': 12.00 }, 
            customer_satisfaction: 0.9
          }
        }
      },
      'quick-service-001': {
        scenario_id: 'quick-service-001',
        scenario_name: 'Quick Service',
        configuration_data: {
          ai_behavior: { priority: 'speed', decision_weights: { speed: 0.5, cost: 0.3, revenue: 0.2 } },
          initial_state: { 
            inventory: { 'Burger Patties': { quantity: 20, unit: 'kg' }, 'Fries': { quantity: 15, unit: 'kg' } },
            staff: 4, 
            menu_prices: { 'Burger Combo': 8.99, 'Fries': 2.99 }, 
            customer_satisfaction: 0.75
          }
        }
      }
    };
    return mockConfigurations[scenarioId] || null;
  }
};

// Middleware for basic request validation and logging
router.use((req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path} at ${new Date().toISOString()}`);
  // Basic validation: Ensure userId is provided in headers or query for tracking
  const userId = req.headers['x-user-id'] || req.query.userId || 'anonymous';
  req.userId = userId;
  next();
});

/**
 * Endpoint: POST /api/decisions/trigger
 * Triggers an AI decision for a specific decision type and scenario.
 * Input: { decisionType, scenarioId, inputData }
 * Output: AI decision result
 */
router.post('/decisions/trigger', async (req, res) => {
  try {
    const { decisionType, scenarioId, inputData } = req.body;
    const userId = req.userId;

    if (!decisionType) {
      return res.status(400).json({ error: 'decisionType is required' });
    }

    if (!['inventory-management', 'dynamic-pricing', 'staffing-optimization'].includes(decisionType)) {
      return res.status(400).json({ error: 'Invalid decisionType. Must be one of: inventory-management, dynamic-pricing, staffing-optimization' });
    }

    // Fetch scenario configuration (from cache if available)
    let scenarioConfig = await getCachedScenarioConfiguration(scenarioId || 'default');
    if (!scenarioConfig) {
      scenarioConfig = await db.getScenarioConfiguration(scenarioId || 'fine-dining-001');
      if (scenarioConfig) {
        await cacheScenarioConfiguration(scenarioId || 'default', scenarioConfig);
      }
    }

    // Prepare input data for AI decision
    const decisionInput = {
      ...inputData,
      scenario: scenarioConfig ? scenarioConfig.configuration_data : { ai_behavior: { priority: 'revenue' }, initial_state: {} }
    };

    // Process AI decision
    const decisionResult = await processDecision(decisionType, decisionInput);

    // Log the decision to database
    await db.logDecision(
      decisionType,
      decisionResult.decision || {},
      scenarioId || 'default',
      userId,
      decisionResult.metrics || {},
      decisionResult.rationale || 'No rationale provided'
    );

    // Return the decision result
    res.status(200).json({
      status: 'success',
      decisionType,
      decision: decisionResult.decision,
      rationale: decisionResult.rationale,
      metrics: decisionResult.metrics || {},
      scenarioId: scenarioId || 'default',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /decisions/trigger:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * Endpoint: POST /api/simulations/start
 * Starts a new simulation run with an initial state based on a scenario.
 * Input: { scenarioId, totalDays }
 * Output: Simulation ID and initial state
 */
router.post('/simulations/start', async (req, res) => {
  try {
    const { scenarioId, totalDays = 7 } = req.body;
    const userId = req.userId;

    // Use loaded profiles if available, otherwise fall back to database configuration
    let profile = profiles[scenarioId];
    let scenarioConfig;
    if (profile) {
      // Apply AI behavior parameters from profile
      const aiConfig = applyAIBehaviorParameters(profile);
      scenarioConfig = {
        scenario_id: scenarioId,
        scenario_name: profile.name,
        configuration_data: {
          ai_behavior: aiConfig,
          initial_state: profile.scenario.initialState
        }
      };
    } else {
      // Fetch scenario configuration (from cache if available)
      scenarioConfig = await getCachedScenarioConfiguration(scenarioId || 'fine-dining-001');
      if (!scenarioConfig) {
        scenarioConfig = await db.getScenarioConfiguration(scenarioId || 'fine-dining-001');
        if (scenarioConfig) {
          await cacheScenarioConfiguration(scenarioId || 'fine-dining-001', scenarioConfig);
        }
      }
    }

    if (!scenarioConfig) {
      return res.status(404).json({ error: 'Scenario configuration not found for the provided scenarioId' });
    }

    // Generate a unique simulation ID
    const simulationId = `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Initialize simulation with initial state from scenario configuration
    const initialState = {
      ...scenarioConfig.configuration_data.initial_state,
      totalDays: totalDays,
      day: 1
    };

    // Create a new simulation engine instance
    const simulationEngine = new SimulationEngine(initialState);

    // Save initial state to database
    await db.saveSimulationState(simulationId, 1, simulationEngine.getCurrentState(), scenarioId || 'fine-dining-001', userId);

    // Cache initial state
    await cacheSimulationState(simulationId, 1, simulationEngine.getCurrentState());

    // Return simulation details
    res.status(201).json({
      status: 'success',
      simulationId: simulationId,
      scenarioId: scenarioId || 'fine-dining-001',
      initialState: simulationEngine.getCurrentState(),
      message: 'Simulation started successfully'
    });
  } catch (error) {
    console.error('Error in /simulations/start:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * Endpoint: POST /api/simulations/advance
 * Advances a simulation by one day, optionally applying AI decisions.
 * Input: { simulationId, aiDecisions }
 * Output: Updated simulation state
 */
router.post('/simulations/advance', async (req, res) => {
  try {
    const { simulationId, aiDecisions = {} } = req.body;
    const userId = req.userId;

    if (!simulationId) {
      return res.status(400).json({ error: 'simulationId is required' });
    }

    // Retrieve the latest state from cache if available
    let currentState = await getCachedSimulationState(simulationId, 'latest');
    let scenarioId = 'unknown';

    if (!currentState) {
      // If not in cache, retrieve from database (placeholder logic)
      const states = await db.getSimulationStates(simulationId, userId);
      if (states.length > 0) {
        // Get the latest day
        const latestState = states.sort((a, b) => b.day - a.day)[0];
        currentState = latestState.stateData;
        scenarioId = latestState.scenarioId || 'unknown';
        await cacheSimulationState(simulationId, 'latest', currentState);
        await cacheSimulationState(simulationId, latestState.day, currentState);
      } else {
        return res.status(404).json({ error: 'Simulation not found or no state available' });
      }
    } else {
      scenarioId = currentState.scenarioId || 'unknown';
    }

    // Initialize simulation engine with the current state
    const simulationEngine = new SimulationEngine(currentState);

    // Advance the simulation by one day with optional AI decisions
    const updatedState = await simulationEngine.advanceDay(aiDecisions);

    // Save the updated state to database
    await db.saveSimulationState(simulationId, updatedState.day, updatedState, scenarioId, userId);

    // Cache the updated state
    await cacheSimulationState(simulationId, updatedState.day, updatedState);
    await cacheSimulationState(simulationId, 'latest', updatedState);

    // Log key metrics if available
    if (updatedState.revenue !== undefined) {
      await db.saveOutcomeMetric(
        'revenue',
        updatedState.revenue,
        { dailySales: updatedState.dailySales || [] },
        simulationId,
        null,
        scenarioId,
        userId,
        updatedState.day
      );
    }

    if (updatedState.customerSatisfaction !== undefined) {
      await db.saveOutcomeMetric(
        'customer-satisfaction',
        updatedState.customerSatisfaction,
        { factors: updatedState.satisfactionFactors || {} },
        simulationId,
        null,
        scenarioId,
        userId,
        updatedState.day
      );
    }

    // Return the updated state
    res.status(200).json({
      status: 'success',
      simulationId: simulationId,
      day: updatedState.day,
      state: updatedState,
      message: 'Simulation advanced successfully'
    });
  } catch (error) {
    console.error('Error in /simulations/advance:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * Endpoint: GET /api/simulations/state
 * Retrieves the current or historical state of a simulation.
 * Input: Query params { simulationId, day (optional) }
 * Output: Simulation state
 */
router.get('/simulations/state', async (req, res) => {
  try {
    const { simulationId, day } = req.query;
    const userId = req.userId;

    if (!simulationId) {
      return res.status(400).json({ error: 'simulationId is required' });
    }

    let stateData = null;
    const targetDay = day ? parseInt(day, 10) : 'latest';

    // Check cache first
    stateData = await getCachedSimulationState(simulationId, targetDay);

    if (!stateData) {
      // If not in cache, retrieve from database (placeholder logic)
      const states = await db.getSimulationStates(simulationId, userId);
      if (states.length > 0) {
        if (targetDay === 'latest') {
          // Get the latest day
          const latestState = states.sort((a, b) => b.day - a.day)[0];
          stateData = latestState.stateData;
          await cacheSimulationState(simulationId, 'latest', stateData);
          await cacheSimulationState(simulationId, latestState.day, stateData);
        } else {
          // Get specific day
          const specificState = states.find(s => s.day === targetDay);
          if (specificState) {
            stateData = specificState.stateData;
            await cacheSimulationState(simulationId, targetDay, stateData);
          }
        }
      }
    }

    if (!stateData) {
      return res.status(404).json({ error: `Simulation state not found for simulationId ${simulationId}${day ? `, day ${day}` : ''}` });
    }

    res.status(200).json({
      status: 'success',
      simulationId: simulationId,
      day: targetDay === 'latest' ? 'latest' : targetDay,
      state: stateData
    });
  } catch (error) {
    console.error('Error in /simulations/state:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * Endpoint: GET /api/logs/decisions
 * Retrieves decision logs for a specific scenario or user.
 * Input: Query params { scenarioId (optional), limit (optional, default 50) }
 * Output: List of decision logs
 */
router.get('/logs/decisions', async (req, res) => {
  try {
    const { scenarioId, limit = 50 } = req.query;
    const userId = req.userId;

    const decisionLogs = await db.getDecisionLogs(scenarioId || null, userId, parseInt(limit, 10));

    res.status(200).json({
      status: 'success',
      count: decisionLogs.length,
      logs: decisionLogs,
      filters: { scenarioId: scenarioId || 'all', userId, limit: parseInt(limit, 10) }
    });
  } catch (error) {
    console.error('Error in /logs/decisions:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * Endpoint: GET /api/metrics/outcomes
 * Retrieves outcome metrics for a specific simulation or metric type.
 * Input: Query params { simulationId (optional), metricType (optional) }
 * Output: List of outcome metrics
 */
router.get('/metrics/outcomes', async (req, res) => {
  try {
    const { simulationId, metricType } = req.query;
    const userId = req.userId;

    const metrics = await db.getOutcomeMetrics(simulationId || null, metricType || null, userId);

    res.status(200).json({
      status: 'success',
      count: metrics.length,
      metrics: metrics,
      filters: { simulationId: simulationId || 'all', metricType: metricType || 'all', userId }
    });
  } catch (error) {
    console.error('Error in /metrics/outcomes:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Export the router for use in the main application
module.exports = router;

// Example usage (for testing purposes)
if (require.main === module) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT} for testing purposes...`);
    console.log('Endpoints available:');
    console.log('- POST /api/decisions/trigger');
    console.log('- POST /api/simulations/start');
    console.log('- POST /api/simulations/advance');
    console.log('- GET /api/simulations/state');
    console.log('- GET /api/logs/decisions');
    console.log('- GET /api/metrics/outcomes');
  });
}
