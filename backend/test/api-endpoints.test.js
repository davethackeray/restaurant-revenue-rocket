// Integration tests for API Endpoints
const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const express = require('express');
const { makeInventoryDecision, makeStaffingDecision, makePricingDecision } = require('../src/ai-decision-module');
const { SimulationEngine } = require('../src/simulation-engine');

// Mock app setup for testing endpoints
const app = express();
app.use(express.json());

// Mock data for testing
const mockState = {
  restaurantType: 'quick-service',
  day: 1,
  sales: [],
  inventory: { 'default ingredient': 100 },
  staff: 5,
  customerSatisfaction: 80,
  revenue: 0,
  priceAdjustments: {}
};

// API Endpoints
app.get('/api/ai-decisions', async (req, res) => {
  const inventoryDecision = await makeInventoryDecision({ salesTrends: [100, 120, 80], currentInventory: 20 });
  const staffingDecision = await makeStaffingDecision({ customerTraffic: [200, 250, 300], currentStaff: 5 });
  const pricingDecision = await makePricingDecision({ demandData: [50, 75, 100], currentPrice: 10 });
  res.json([
    { type: 'inventory', ...inventoryDecision },
    { type: 'staffing', ...staffingDecision },
    { type: 'pricing', ...pricingDecision }
  ]);
});

app.post('/api/simulations/init', (req, res) => {
  const { restaurantType } = req.body;
  const engine = new SimulationEngine();
  const initialState = engine.initializeState(restaurantType || 'quick-service');
  res.json(initialState);
});

app.post('/api/simulations/advance', (req, res) => {
  const { state } = req.body;
  const engine = new SimulationEngine();
  const updatedState = engine.advanceDay(state);
  res.json(updatedState);
});

app.post('/api/simulations/evaluate', (req, res) => {
  const { state } = req.body;
  const engine = new SimulationEngine();
  const metrics = engine.evaluateOutcome(state);
  res.json(metrics);
});

describe('API Endpoints', () => {
  let makeInventoryDecisionStub;
  let makeStaffingDecisionStub;
  let makePricingDecisionStub;

  beforeEach(() => {
    makeInventoryDecisionStub = sinon.stub().resolves({
      order: 'Place order for 50 units of ingredient X',
      quantity: 50,
      ingredient: 'ingredient X',
      rationale: 'Based on sales trends, inventory is low.'
    });
    makeStaffingDecisionStub = sinon.stub().resolves({
      adjustment: 'Increase staff by 2 for peak hours',
      change: 2,
      timeSlot: 'peak hours',
      rationale: 'High customer traffic expected.'
    });
    makePricingDecisionStub = sinon.stub().resolves({
      priceChange: 'Increase price of item Y by 10%',
      percentage: 10,
      item: 'item Y',
      rationale: 'Demand is high for this item.'
    });

    sinon.replace(makeInventoryDecision, 'callThrough', makeInventoryDecisionStub);
    sinon.replace(makeStaffingDecision, 'callThrough', makeStaffingDecisionStub);
    sinon.replace(makePricingDecision, 'callThrough', makePricingDecisionStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/ai-decisions', () => {
    it('should return a list of AI decisions', async () => {
      const response = await request(app).get('/api/ai-decisions');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array').with.lengthOf(3);
      expect(response.body[0].type).to.equal('inventory');
      expect(response.body[0].order).to.equal('Place order for 50 units of ingredient X');
      expect(response.body[1].type).to.equal('staffing');
      expect(response.body[1].adjustment).to.equal('Increase staff by 2 for peak hours');
      expect(response.body[2].type).to.equal('pricing');
      expect(response.body[2].priceChange).to.equal('Increase price of item Y by 10%');
    });
  });

  describe('POST /api/simulations/init', () => {
    it('should initialize simulation state for given restaurant type', async () => {
      const response = await request(app)
        .post('/api/simulations/init')
        .send({ restaurantType: 'quick-service' });

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body.restaurantType).to.equal('quick-service');
      expect(response.body.day).to.equal(1);
      expect(response.body.inventory).to.be.an('object').that.has.property('default ingredient', 100);
      expect(response.body.staff).to.equal(5);
      expect(response.body.customerSatisfaction).to.equal(80);
      expect(response.body.revenue).to.equal(0);
    });

    it('should initialize different values for fine-dining restaurant type', async () => {
      const response = await request(app)
        .post('/api/simulations/init')
        .send({ restaurantType: 'fine-dining' });

      expect(response.status).to.equal(200);
      expect(response.body.restaurantType).to.equal('fine-dining');
      expect(response.body.inventory).to.be.an('object').that.has.property('default ingredient', 50);
      expect(response.body.staff).to.equal(8);
      expect(response.body.customerSatisfaction).to.equal(90);
    });
  });

  describe('POST /api/simulations/advance', () => {
    it('should advance simulation day and update state', async () => {
      const response = await request(app)
        .post('/api/simulations/advance')
        .send({ state: mockState });

      expect(response.status).to.equal(200);
      expect(response.body.day).to.equal(2);
      expect(response.body.sales.length).to.equal(1);
      expect(response.body.revenue).to.be.greaterThan(0);
      expect(response.body.inventory['default ingredient']).to.be.lessThan(100);
    });
  });

  describe('POST /api/simulations/evaluate', () => {
    it('should evaluate simulation outcomes and return metrics', async () => {
      const response = await request(app)
        .post('/api/simulations/evaluate')
        .send({ state: mockState });

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body).to.have.property('revenueImpact');
      expect(response.body).to.have.property('wasteReduction');
      expect(response.body).to.have.property('satisfactionChange');
    });
  });
});
