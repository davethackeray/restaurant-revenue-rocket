const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const { makeInventoryDecision, makeStaffingDecision, makePricingDecision } = require('../src/ai-decision-module');

describe('AI Decision Module', () => {
  let axiosPostStub;

  beforeEach(() => {
    axiosPostStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('makeInventoryDecision', () => {
    it('should return inventory decision based on Gemini API response', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  order: 'Place order for 50 units of ingredient X',
                  quantity: 50,
                  ingredient: 'ingredient X',
                  rationale: 'Based on sales trends, inventory is low.'
                })
              }]
            }
          }]
        }
      };
      axiosPostStub.resolves(mockResponse);

      const data = { salesTrends: [100, 120, 80], currentInventory: 20 };
      const decision = await makeInventoryDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.order).to.equal('Place order for 50 units of ingredient X');
      expect(decision.quantity).to.equal(50);
      expect(decision.ingredient).to.equal('ingredient X');
      expect(decision.rationale).to.equal('Based on sales trends, inventory is low.');
      expect(axiosPostStub.calledOnce).to.be.true;
    });

    it('should handle API failure with fallback decision', async () => {
      axiosPostStub.rejects(new Error('API Error'));

      const data = { salesTrends: [100, 120, 80], currentInventory: 20 };
      const decision = await makeInventoryDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.order).to.equal('Place order for 30 units of default ingredient');
      expect(decision.quantity).to.equal(30);
      expect(decision.ingredient).to.equal('default ingredient');
      expect(decision.rationale).to.include('Fallback decision due to API unavailability');
    });

    it('should handle missing API key with fallback decision', async () => {
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = '';

      const data = { salesTrends: [100, 120, 80], currentInventory: 20 };
      const decision = await makeInventoryDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.order).to.equal('Place order for 30 units of default ingredient');
      expect(decision.rationale).to.include('API key not configured');

      process.env.GEMINI_API_KEY = originalApiKey;
    });
  });

  describe('makeStaffingDecision', () => {
    it('should return staffing decision based on Gemini API response', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  adjustment: 'Increase staff by 2 for peak hours',
                  change: 2,
                  timeSlot: 'peak hours',
                  rationale: 'High customer traffic expected.'
                })
              }]
            }
          }]
        }
      };
      axiosPostStub.resolves(mockResponse);

      const data = { customerTraffic: [200, 250, 300], currentStaff: 5 };
      const decision = await makeStaffingDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.adjustment).to.equal('Increase staff by 2 for peak hours');
      expect(decision.change).to.equal(2);
      expect(decision.timeSlot).to.equal('peak hours');
      expect(decision.rationale).to.equal('High customer traffic expected.');
      expect(axiosPostStub.calledOnce).to.be.true;
    });

    it('should handle API failure with fallback decision', async () => {
      axiosPostStub.rejects(new Error('API Error'));

      const data = { customerTraffic: [200, 250, 300], currentStaff: 5 };
      const decision = await makeStaffingDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.adjustment).to.equal('Increase staff by 1 for default shift');
      expect(decision.change).to.equal(1);
      expect(decision.timeSlot).to.equal('default shift');
      expect(decision.rationale).to.include('Fallback decision due to API unavailability');
    });
  });

  describe('makePricingDecision', () => {
    it('should return pricing decision based on Gemini API response', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  priceChange: 'Increase price of item Y by 10%',
                  percentage: 10,
                  item: 'item Y',
                  rationale: 'Demand is high for this item.'
                })
              }]
            }
          }]
        }
      };
      axiosPostStub.resolves(mockResponse);

      const data = { demandData: [50, 75, 100], currentPrice: 10 };
      const decision = await makePricingDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.priceChange).to.equal('Increase price of item Y by 10%');
      expect(decision.percentage).to.equal(10);
      expect(decision.item).to.equal('item Y');
      expect(decision.rationale).to.equal('Demand is high for this item.');
      expect(axiosPostStub.calledOnce).to.be.true;
    });

    it('should handle API failure with fallback decision', async () => {
      axiosPostStub.rejects(new Error('API Error'));

      const data = { demandData: [50, 75, 100], currentPrice: 10 };
      const decision = await makePricingDecision(data);

      expect(decision).to.be.an('object');
      expect(decision.priceChange).to.equal('Increase price of default item by 5%');
      expect(decision.percentage).to.equal(5);
      expect(decision.item).to.equal('default item');
      expect(decision.rationale).to.include('Fallback decision due to API unavailability');
    });
  });
});
