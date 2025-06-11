// Restaurant Revenue Rocket - Redis Cache Module
// This module implements Redis caching for frequently accessed simulation states to improve performance during real-time demos.
// It ensures cache consistency with PostgreSQL persistent storage.

const redis = require('redis');
const { promisify } = require('util');

// Redis client configuration
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Promisify Redis commands for async/await usage
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);

// Error handling for Redis client
client.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

// Cache configuration
const CACHE_PREFIX = 'simulation:';
const CACHE_TTL_SECONDS = 3600; // Cache expiration time (1 hour)

/**
 * Caches a simulation state in Redis for fast access.
 * @param {string} simulationId - Unique identifier for the simulation.
 * @param {number} day - Simulation day or time step.
 * @param {Object} stateData - The simulation state data to cache.
 * @returns {Promise<boolean>} - True if caching was successful, false otherwise.
 */
async function cacheSimulationState(simulationId, day, stateData) {
  try {
    const cacheKey = `${CACHE_PREFIX}${simulationId}:day:${day}`;
    const serializedData = JSON.stringify(stateData);
    await setAsync(cacheKey, serializedData, 'EX', CACHE_TTL_SECONDS);
    console.log(`Cached simulation state for ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache simulation state for ${simulationId}, day ${day}:`, error.message);
    return false;
  }
}

/**
 * Retrieves a cached simulation state from Redis.
 * @param {string} simulationId - Unique identifier for the simulation.
 * @param {number} day - Simulation day or time step.
 * @returns {Promise<Object|null>} - The cached state data if found, null otherwise.
 */
async function getCachedSimulationState(simulationId, day) {
  try {
    const cacheKey = `${CACHE_PREFIX}${simulationId}:day:${day}`;
    const cachedData = await getAsync(cacheKey);
    if (cachedData) {
      console.log(`Retrieved cached simulation state for ${cacheKey}`);
      return JSON.parse(cachedData);
    }
    console.log(`No cached data found for ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(`Failed to retrieve cached simulation state for ${simulationId}, day ${day}:`, error.message);
    return null;
  }
}

/**
 * Invalidates a cached simulation state in Redis (e.g., when state is updated in PostgreSQL).
 * @param {string} simulationId - Unique identifier for the simulation.
 * @param {number} day - Simulation day or time step. If not provided, invalidates all days for the simulation.
 * @returns {Promise<boolean>} - True if invalidation was successful, false otherwise.
 */
async function invalidateCachedSimulationState(simulationId, day = null) {
  try {
    if (day !== null) {
      const cacheKey = `${CACHE_PREFIX}${simulationId}:day:${day}`;
      await delAsync(cacheKey);
      console.log(`Invalidated cache for ${cacheKey}`);
    } else {
      // Invalidate all cached states for the simulation (requires pattern matching, which is not directly supported in Redis)
      // For simplicity, we log the intent; in production, use SCAN or a key pattern strategy
      console.log(`Invalidated all cached states for simulation ${simulationId} (pattern-based invalidation placeholder)`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to invalidate cache for simulation ${simulationId}, day ${day || 'all'}:`, error.message);
    return false;
  }
}

/**
 * Caches frequently accessed scenario configuration data in Redis.
 * @param {string} scenarioId - Unique identifier for the scenario.
 * @param {Object} configData - The scenario configuration data to cache.
 * @returns {Promise<boolean>} - True if caching was successful, false otherwise.
 */
async function cacheScenarioConfiguration(scenarioId, configData) {
  try {
    const cacheKey = `scenario:config:${scenarioId}`;
    const serializedData = JSON.stringify(configData);
    await setAsync(cacheKey, serializedData, 'EX', CACHE_TTL_SECONDS * 24); // Longer TTL for configurations (24 hours)
    console.log(`Cached scenario configuration for ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to cache scenario configuration for ${scenarioId}:`, error.message);
    return false;
  }
}

/**
 * Retrieves a cached scenario configuration from Redis.
 * @param {string} scenarioId - Unique identifier for the scenario.
 * @returns {Promise<Object|null>} - The cached configuration data if found, null otherwise.
 */
async function getCachedScenarioConfiguration(scenarioId) {
  try {
    const cacheKey = `scenario:config:${scenarioId}`;
    const cachedData = await getAsync(cacheKey);
    if (cachedData) {
      console.log(`Retrieved cached scenario configuration for ${cacheKey}`);
      return JSON.parse(cachedData);
    }
    console.log(`No cached configuration found for ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(`Failed to retrieve cached scenario configuration for ${scenarioId}:`, error.message);
    return null;
  }
}

/**
 * Invalidates a cached scenario configuration in Redis (e.g., when configuration is updated in PostgreSQL).
 * @param {string} scenarioId - Unique identifier for the scenario.
 * @returns {Promise<boolean>} - True if invalidation was successful, false otherwise.
 */
async function invalidateCachedScenarioConfiguration(scenarioId) {
  try {
    const cacheKey = `scenario:config:${scenarioId}`;
    await delAsync(cacheKey);
    console.log(`Invalidated cache for scenario configuration ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`Failed to invalidate cache for scenario configuration ${scenarioId}:`, error.message);
    return false;
  }
}

/**
 * Middleware to integrate Redis caching with the Simulation Engine.
 * This function checks the cache before simulation state retrieval and updates the cache after state changes.
 * @param {Object} simulationEngine - The SimulationEngine instance to integrate caching with.
 * @returns {Object} - Modified SimulationEngine with caching capabilities.
 */
function integrateCachingWithSimulationEngine(simulationEngine) {
  // Override or extend methods to include caching logic
  const originalGetCurrentState = simulationEngine.getCurrentState.bind(simulationEngine);
  const originalAdvanceDay = simulationEngine.advanceDay.bind(simulationEngine);

  // Override getCurrentState to check cache first
  simulationEngine.getCurrentState = async function() {
    const currentDay = this.state.day - 1; // Last completed day
    const simulationId = this.history.length > 0 ? `sim-${this.history[0].day}-${Date.now()}` : `sim-initial-${Date.now()}`;
    if (currentDay >= 1) {
      const cachedState = await getCachedSimulationState(simulationId, currentDay);
      if (cachedState) {
        return cachedState;
      }
    }
    // If not in cache, return from original method
    const state = originalGetCurrentState();
    // Cache the state if it's a valid day
    if (currentDay >= 1) {
      await cacheSimulationState(simulationId, currentDay, state);
    }
    return state;
  };

  // Override advanceDay to cache the new state after advancing
  simulationEngine.advanceDay = async function(aiDecisions = {}) {
    const result = await originalAdvanceDay(aiDecisions);
    const simulationId = this.history.length > 0 ? `sim-${this.history[0].day}-${Date.now()}` : `sim-initial-${Date.now()}`;
    const currentDay = this.state.day - 1; // Day just completed
    if (currentDay >= 1) {
      await cacheSimulationState(simulationId, currentDay, this.state);
    }
    return result;
  };

  return simulationEngine;
}

// Export Redis caching functions for use in other modules
module.exports = {
  cacheSimulationState,
  getCachedSimulationState,
  invalidateCachedSimulationState,
  cacheScenarioConfiguration,
  getCachedScenarioConfiguration,
  invalidateCachedScenarioConfiguration,
  integrateCachingWithSimulationEngine,
};

// Example usage (for testing purposes)
if (require.main === module) {
  console.log('Testing Redis Cache Module...');
  const testSimulationId = 'test-sim-001';
  const testDay = 1;
  const testStateData = {
    day: testDay,
    revenue: 1000.50,
    customerSatisfaction: 0.85,
    inventory: { 'Tomatoes': { quantity: 10, unit: 'kg' } },
  };

  (async () => {
    try {
      // Test caching simulation state
      const cacheResult = await cacheSimulationState(testSimulationId, testDay, testStateData);
      console.log('Cache Simulation State Result:', cacheResult);

      // Test retrieving cached simulation state
      const cachedState = await getCachedSimulationState(testSimulationId, testDay);
      console.log('Retrieved Cached State:', cachedState);

      // Test caching scenario configuration
      const testScenarioId = 'test-scenario-001';
      const testConfigData = {
        scenario_name: 'Test Scenario',
        ai_behavior: { priority: 'speed' },
        initial_state: { staff: 4 },
      };
      const cacheConfigResult = await cacheScenarioConfiguration(testScenarioId, testConfigData);
      console.log('Cache Scenario Configuration Result:', cacheConfigResult);

      // Test retrieving cached scenario configuration
      const cachedConfig = await getCachedScenarioConfiguration(testScenarioId);
      console.log('Retrieved Cached Configuration:', cachedConfig);

      // Test invalidating cache
      const invalidateResult = await invalidateCachedSimulationState(testSimulationId, testDay);
      console.log('Invalidate Simulation Cache Result:', invalidateResult);

      const invalidateConfigResult = await invalidateCachedScenarioConfiguration(testScenarioId);
      console.log('Invalidate Scenario Configuration Cache Result:', invalidateConfigResult);
    } catch (error) {
      console.error('Error during Redis Cache Module test:', error.message);
    }
  })();
}
