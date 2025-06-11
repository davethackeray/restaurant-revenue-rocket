const { expect } = require('chai');
const { SimulationEngine } = require('../src/simulation-engine');

describe('Simulation Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  describe('initializeState', () => {
    it('should initialize simulation state with default values', () => {
      const initialState = engine.initializeState('quick-service');

      expect(initialState).to.be.an('object');
      expect(initialState.restaurantType).to.equal('quick-service');
      expect(initialState.day).to.equal(1);
      expect(initialState.sales).to.be.an('array').that.is.empty;
      expect(initialState.inventory).to.be.an('object').that.has.property('default ingredient', 100);
      expect(initialState.staff).to.equal(5);
      expect(initialState.customerSatisfaction).to.equal(80);
      expect(initialState.revenue).to.equal(0);
    });

    it('should initialize different values for fine-dining restaurant type', () => {
      const initialState = engine.initializeState('fine-dining');

      expect(initialState).to.be.an('object');
      expect(initialState.restaurantType).to.equal('fine-dining');
      expect(initialState.inventory).to.be.an('object').that.has.property('default ingredient', 50);
      expect(initialState.staff).to.equal(8);
      expect(initialState.customerSatisfaction).to.equal(90);
    });
  });

  describe('advanceDay', () => {
    it('should advance day and update state based on current conditions', () => {
      const state = engine.initializeState('quick-service');
      const initialDay = state.day;
      const initialSales = state.sales.length;

      const updatedState = engine.advanceDay(state);

      expect(updatedState.day).to.equal(initialDay + 1);
      expect(updatedState.sales.length).to.equal(initialSales + 1);
      expect(updatedState.revenue).to.be.greaterThan(0);
      expect(updatedState.customerSatisfaction).to.be.within(0, 100);
    });

    it('should decrease inventory based on sales', () => {
      const state = engine.initializeState('quick-service');
      const initialInventory = state.inventory['default ingredient'];

      const updatedState = engine.advanceDay(state);

      expect(updatedState.inventory['default ingredient']).to.be.lessThan(initialInventory);
    });
  });

  describe('applyDecision', () => {
    it('should apply inventory decision and update state', () => {
      const state = engine.initializeState('quick-service');
      const initialInventory = state.inventory['default ingredient'];
      const decision = {
        type: 'inventory',
        order: 'Place order for 50 units of ingredient X',
        quantity: 50,
        ingredient: 'ingredient X',
        rationale: 'Based on sales trends, inventory is low.'
      };

      const updatedState = engine.applyDecision(state, decision);

      expect(updatedState.inventory['ingredient X']).to.equal(initialInventory + 50);
    });

    it('should apply staffing decision and update state', () => {
      const state = engine.initializeState('quick-service');
      const initialStaff = state.staff;
      const decision = {
        type: 'staffing',
        adjustment: 'Increase staff by 2 for peak hours',
        change: 2,
        timeSlot: 'peak hours',
        rationale: 'High customer traffic expected.'
      };

      const updatedState = engine.applyDecision(state, decision);

      expect(updatedState.staff).to.equal(initialStaff + 2);
    });

    it('should apply pricing decision and update state', () => {
      const state = engine.initializeState('quick-service');
      const decision = {
        type: 'pricing',
        priceChange: 'Increase price of item Y by 10%',
        percentage: 10,
        item: 'item Y',
        rationale: 'Demand is high for this item.'
      };

      const updatedState = engine.applyDecision(state, decision);

      expect(updatedState.priceAdjustments).to.be.an('object').that.has.property('item Y', 10);
    });
  });

  describe('evaluateOutcome', () => {
    it('should evaluate outcomes and return metrics', () => {
      const state = engine.initializeState('quick-service');
      engine.advanceDay(state);

      const metrics = engine.evaluateOutcome(state);

      expect(metrics).to.be.an('object');
      expect(metrics).to.have.property('revenueImpact');
      expect(metrics).to.have.property('wasteReduction');
      expect(metrics).to.have.property('satisfactionChange');
    });
  });
});
