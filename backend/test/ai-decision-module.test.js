// Restaurant Revenue Rocket - AI Decision-Making Module Tests
// This script tests the integration with the Gemini API for latency, error handling, and response accuracy.

const assert = require('assert');
const { makeDecision, processDecision } = require('../src/ai-decision-module');

// Test data for inventory management scenario
const testInputData = {
  inventoryData: {
    'Tomatoes': { quantity: 10, unit: 'kg', expiry: '2023-12-05' },
    'Lettuce': { quantity: 5, unit: 'kg', expiry: '2023-12-03' },
    'Chicken': { quantity: 20, unit: 'kg', expiry: '2023-12-10' },
  },
  salesTrends: {
    'Tomatoes': { soldLastWeek: 15, unit: 'kg' },
    'Lettuce': { soldLastWeek: 10, unit: 'kg' },
    'Chicken': { soldLastWeek: 25, unit: 'kg' },
  },
  predictedDemand: {
    'Tomatoes': { nextWeek: 18, unit: 'kg' },
    'Lettuce': { nextWeek: 12, unit: 'kg' },
    'Chicken': { nextWeek: 30, unit: 'kg' },
  },
  seasonalFactors: 'Holiday season approaching, expect 20% increase in demand.',
  budget: '$500 for inventory order',
  storageCapacity: '100 kg total across all items',
};

// Mock function to simulate API failure for error handling tests
function mockApiFailure() {
  throw new Error('Mock API failure: Unable to connect to Gemini API');
}

// Test suite
describe('AI Decision-Making Module - Gemini API Integration Tests', function () {
  this.timeout(10000); // Set timeout to 10 seconds for API calls

    describe('Response Accuracy', function () {
    it('should return a valid JSON decision for inventory management scenario', async function () {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('Response Accuracy Test Skipped: Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.');
        return;
      }
      try {
        const result = await makeDecision('inventory-management', testInputData);
        assert.strictEqual(typeof result, 'object', 'Result should be an object');
        assert.strictEqual(typeof result.decision, 'object', 'Result should contain a decision object');
        assert(Array.isArray(result.decision.itemsToOrder), 'itemsToOrder should be an array');
        assert.strictEqual(typeof result.decision.orderTiming, 'string', 'orderTiming should be a string');
        assert.strictEqual(typeof result.decision.rationale, 'string', 'rationale should be a string');
        assert.strictEqual(typeof result.decision.expectedImpact, 'object', 'expectedImpact should be an object');
        console.log('Response Accuracy Test Passed:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Response Accuracy Test Failed:', error.message);
        throw error;
      }
    });
  });

  describe('Latency Test', function () {
    it('should complete API call within acceptable latency (under 5 seconds)', async function () {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('Latency Test Skipped: Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.');
        return;
      }
      const startTime = Date.now();
      try {
        await makeDecision('inventory-management', testInputData);
        const endTime = Date.now();
        const latency = endTime - startTime;
        assert(latency < 5000, `Latency of ${latency}ms exceeds acceptable threshold of 5000ms`);
        console.log(`Latency Test Passed: API call completed in ${latency}ms`);
      } catch (error) {
        console.error('Latency Test Failed:', error.message);
        throw error;
      }
    });
  });

  describe('Error Handling', function () {
    it('should handle API key absence gracefully', async function () {
      // Temporarily unset API key for this test (mocking missing key)
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = '';
      
      try {
        await makeDecision('inventory-management', testInputData);
        assert.fail('Should have thrown an error for missing API key');
      } catch (error) {
        assert.strictEqual(error.message, 'Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.', 'Error message should indicate missing API key');
        console.log('Error Handling Test Passed for Missing API Key:', error.message);
      } finally {
        // Restore original API key
        process.env.GEMINI_API_KEY = originalApiKey;
      }
    });

    it('should handle unsupported scenario gracefully', async function () {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('Unsupported Scenario Test Skipped: Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.');
        return;
      }
      try {
        await makeDecision('unsupported-scenario', testInputData);
        assert.fail('Should have thrown an error for unsupported scenario');
      } catch (error) {
        assert(error.message.includes('Unsupported scenario'), 'Error message should indicate unsupported scenario');
        console.log('Error Handling Test Passed for Unsupported Scenario:', error.message);
      }
    });
  });

  describe('End-to-End Process Decision', function () {
    it('should process a decision and log it successfully', async function () {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('End-to-End Process Decision Test Skipped: Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.');
        return;
      }
      try {
        const result = await processDecision('inventory-management', testInputData);
        assert.strictEqual(typeof result, 'object', 'Result should be an object');
        assert.strictEqual(typeof result.decision, 'object', 'Result should contain a decision object');
        console.log('End-to-End Process Decision Test Passed:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('End-to-End Process Decision Test Failed:', error.message);
        throw error;
      }
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running AI Decision-Making Module Tests...');
  const Mocha = require('mocha');
  const mocha = new Mocha();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}
