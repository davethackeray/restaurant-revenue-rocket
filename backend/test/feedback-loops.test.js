// Unit tests for Feedback Loops in Simulation Engine
const { expect } = require('chai');
const sinon = require('sinon');
const { SimulationEngine } = require('../src/simulation-engine');

describe('Feedback Loops in Simulation Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  describe('evaluateOutcome', () => {
    it('should return positive revenue impact when decisions improve sales', () => {
      const state = engine.initializeState('quick-service');
      // Simulate a day with a pricing decision that increases revenue
      const decision = {
        type: 'pricing',
        priceChange: 'Increase price of item Y by 10%',
        percentage: 10,
        item: 'item Y',
        rationale: 'Demand is high for this item.'
      };
      const updatedState = engine.applyDecision(state, decision);
      engine.advanceDay(updatedState);

      const metrics = engine.evaluateOutcome(updatedState);

      expect(metrics.revenueImpact).to.be.greaterThan(0);
      expect(metrics.satisfactionChange).to.be.within(-10, 10); // Satisfaction might vary slightly
    });

    it('should return negative satisfaction change when staffing is insufficient', () => {
      const state = engine.initializeState('quick-service');
      // Simulate high customer traffic with no staffing adjustment
      engine.advanceDay(state);

      const metrics = engine.evaluateOutcome(state);

      expect(metrics.satisfactionChange).to.be.lessThan(0); // Satisfaction drops due to long wait times
    });

    it('should return positive waste reduction when inventory decision matches demand', () => {
      const state = engine.initializeState('quick-service');
      const decision = {
        type: 'inventory',
        order: 'Place order for 50 units of ingredient X',
        quantity: 50,
        ingredient: 'ingredient X',
        rationale: 'Based on sales trends, inventory is low.'
      };
      const updatedState = engine.applyDecision(state, decision);
      engine.advanceDay(updatedState);

      const metrics = engine.evaluateOutcome(updatedState);

      expect(metrics.wasteReduction).to.be.greaterThanOrEqual(0); // Waste reduction should be neutral or positive
    });
  });

  describe('adjustStrategy', () => {
    it('should adjust strategy to increase staff when satisfaction drops significantly', () => {
      const state = engine.initializeState('quick-service');
      // Simulate a day with low satisfaction
      state.customerSatisfaction = 60;
      const outcomes = [{ day: 1, revenueImpact: 500, satisfactionChange: -20, wasteReduction: 0 }];

      const strategyAdjustment = engine.adjustStrategy(state, outcomes);

      expect(strategyAdjustment).to.be.an('object');
      expect(strategyAdjustment.staffPriority).to.be.greaterThan(1); // Increase priority for staffing decisions
    });

    it('should adjust strategy to reduce inventory orders when waste is high', () => {
      const state = engine.initializeState('quick-service');
      const outcomes = [{ day: 1, revenueImpact: 500, satisfactionChange: 0, wasteReduction: -30 }];

      const strategyAdjustment = engine.adjustStrategy(state, outcomes);

      expect(strategyAdjustment).to.be.an('object');
      expect(strategyAdjustment.inventoryConservatism).to.be.greaterThan(1); // Be more conservative with inventory orders
    });

    it('should maintain strategy when outcomes are balanced', () => {
      const state = engine.initializeState('quick-service');
      const outcomes = [{ day: 1, revenueImpact: 500, satisfactionChange: 2, wasteReduction: 5 }];

      const strategyAdjustment = engine.adjustStrategy(state, outcomes);

      expect(strategyAdjustment).to.be.an('object');
      expect(strategyAdjustment.staffPriority).to.equal(1); // No significant change needed
      expect(strategyAdjustment.inventoryConservatism).to.equal(1); // No significant change needed
    });
  });
});
