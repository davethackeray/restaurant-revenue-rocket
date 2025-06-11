// Restaurant Revenue Rocket - Simulation Engine
// This module models restaurant operations over time, incorporating AI decisions to simulate impacts on sales, inventory, and customer satisfaction.

const fs = require('fs');
const path = require('path');
const { processDecision } = require('./ai-decision-module');

/**
 * Simulation Engine class to model restaurant operations.
 */
class SimulationEngine {
  constructor(initialState = {}) {
    // Default initial state for the simulation
    this.state = {
      day: initialState.day || 1,
      totalDays: initialState.totalDays || 7, // Default to a 7-day simulation
      inventory: initialState.inventory || {
        'Tomatoes': { quantity: 10, unit: 'kg', expiry: '2023-12-05', costPerUnit: 2.5 },
        'Lettuce': { quantity: 5, unit: 'kg', expiry: '2023-12-03', costPerUnit: 1.8 },
        'Chicken': { quantity: 20, unit: 'kg', expiry: '2023-12-10', costPerUnit: 5.0 },
      },
      menuPrices: initialState.menuPrices || {
        'Burger': { price: 10.99, costToMake: 4.50, demandFactor: 1.0 },
        'Salad': { price: 8.99, costToMake: 3.00, demandFactor: 0.8 },
        'Soda': { price: 2.99, costToMake: 0.50, demandFactor: 1.2 },
      },
      staffSchedule: initialState.staffSchedule || {
        'Monday': { 'Lunch': ['Alice', 'Bob'], 'Dinner': ['Charlie', 'Dana'] },
        'Tuesday': { 'Lunch': ['Alice', 'Eve'], 'Dinner': ['Bob', 'Dana'] },
        'Wednesday': { 'Lunch': ['Charlie', 'Eve'], 'Dinner': ['Alice', 'Bob'] },
        'Thursday': { 'Lunch': ['Dana', 'Eve'], 'Dinner': ['Alice', 'Charlie'] },
        'Friday': { 'Lunch': ['Bob', 'Dana'], 'Dinner': ['Alice', 'Eve'] },
        'Saturday': { 'Lunch': ['Charlie', 'Bob'], 'Dinner': ['Dana', 'Eve'] },
        'Sunday': { 'Lunch': ['Alice', 'Dana'], 'Dinner': ['Bob', 'Charlie'] },
      },
      staffCosts: initialState.staffCosts || {
        'Alice': { hourlyRate: 15.0, hoursPerShift: 4 },
        'Bob': { hourlyRate: 14.5, hoursPerShift: 4 },
        'Charlie': { hourlyRate: 15.5, hoursPerShift: 4 },
        'Dana': { hourlyRate: 14.0, hoursPerShift: 4 },
        'Eve': { hourlyRate: 15.0, hoursPerShift: 4 },
      },
      dailySales: initialState.dailySales || [],
      revenue: initialState.revenue || 0.0,
      costs: initialState.costs || { inventory: 0.0, labor: 0.0, total: 0.0 },
      customerSatisfaction: initialState.customerSatisfaction || 0.85, // 85% satisfaction as a starting point
      waste: initialState.waste || { items: [], cost: 0.0 },
    };
    this.history = [];
    this.maxHistorySize = 100; // Limit history size to prevent memory issues
  }

  /**
   * Advances the simulation by one day, applying AI decisions and updating state.
   * @param {Object} aiDecisions - Decisions from the AI module to apply for the current day.
   * @returns {Object} - Updated state after the day's simulation.
   */
  advanceDay(aiDecisions = {}) {
    if (this.state.day > this.state.totalDays) {
      console.log(`Simulation completed. Current day ${this.state.day} exceeds total days ${this.state.totalDays}.`);
      return this.state;
    }

    console.log(`Advancing simulation to Day ${this.state.day}...`);

    try {
      // Apply AI decisions if provided
      this.applyAIDecisions(aiDecisions);

      // Simulate daily operations
      this.simulateDailyOperations();

      // Log the day's state for history
      if (this.history.length < this.maxHistorySize) {
        this.history.push({
          day: this.state.day,
          state: JSON.parse(JSON.stringify(this.state)), // Deep copy of current state
        });
      } else {
        console.warn('History size limit reached. Oldest history entry will be removed to save memory.');
        this.history.shift(); // Remove oldest entry
        this.history.push({
          day: this.state.day,
          state: JSON.parse(JSON.stringify(this.state)),
        });
      }

      // Increment day
      this.state.day += 1;
    } catch (error) {
      console.error(`Error advancing simulation to Day ${this.state.day}:`, error.message);
      // Ensure simulation continues with minimal disruption
      this.state.day += 1;
    }

    return this.state;
  }

  /**
   * Applies AI decisions to the current state.
   * @param {Object} aiDecisions - Decisions from AI for inventory, staffing, and pricing.
   */
  applyAIDecisions(aiDecisions) {
    try {
      if (aiDecisions['inventory-management'] && aiDecisions['inventory-management'].decision) {
        const inventoryDecision = aiDecisions['inventory-management'].decision;
        if (inventoryDecision.itemsToOrder && inventoryDecision.itemsToOrder.length > 0) {
          inventoryDecision.itemsToOrder.forEach(item => {
            if (!item || typeof item !== 'object') {
              console.warn('Invalid inventory item in AI decision. Skipping.');
              return;
            }
            if (this.state.inventory[item.item]) {
              this.state.inventory[item.item].quantity += item.quantity || 0;
            } else {
              this.state.inventory[item.item] = {
                quantity: item.quantity || 0,
                unit: item.unit || 'units',
                expiry: 'N/A', // Placeholder, to be updated with real data
                costPerUnit: 0.0, // Placeholder
              };
            }
            const costPerUnit = this.state.inventory[item.item].costPerUnit || 0.0;
            const costIncrease = costPerUnit * (item.quantity || 0);
            this.state.costs.inventory += costIncrease;
            console.log(`Applied AI inventory decision: Ordered ${item.quantity || 0} ${item.unit || 'units'} of ${item.item}. Cost: $${costIncrease.toFixed(2)}`);
          });
          this.state.costs.total = this.state.costs.inventory + this.state.costs.labor;
        }
      }

      if (aiDecisions['staffing-optimization'] && aiDecisions['staffing-optimization'].decision) {
        const staffingDecision = aiDecisions['staffing-optimization'].decision;
        if (staffingDecision.schedule && staffingDecision.schedule.length > 0) {
          staffingDecision.schedule.forEach(shift => {
            if (!shift || typeof shift !== 'object') {
              console.warn('Invalid shift data in AI decision. Skipping.');
              return;
            }
            const day = shift.day || 'Unknown';
            const shiftTime = shift.shift || 'Unknown';
            if (this.state.staffSchedule[day]) {
              this.state.staffSchedule[day][shiftTime] = shift.staffAssigned || [];
              console.log(`Applied AI staffing decision for ${day} ${shiftTime}.`);
            } else {
              console.warn(`Day ${day} not found in staff schedule. Skipping shift update.`);
            }
          });
          // Recalculate labor costs based on new schedule
          this.calculateLaborCosts();
        }
      }

      if (aiDecisions['dynamic-pricing'] && aiDecisions['dynamic-pricing'].decision) {
        const pricingDecision = aiDecisions['dynamic-pricing'].decision;
        if (pricingDecision.priceAdjustments && pricingDecision.priceAdjustments.length > 0) {
          pricingDecision.priceAdjustments.forEach(adjustment => {
            if (!adjustment || typeof adjustment !== 'object') {
              console.warn('Invalid price adjustment in AI decision. Skipping.');
              return;
            }
            if (this.state.menuPrices[adjustment.item]) {
              this.state.menuPrices[adjustment.item].price = adjustment.newPrice || this.state.menuPrices[adjustment.item].price;
              console.log(`Applied AI pricing decision: Updated price for ${adjustment.item} to $${adjustment.newPrice || this.state.menuPrices[adjustment.item].price}`);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error applying AI decisions:', error.message);
    }
  }

  /**
   * Simulates daily operations including sales, inventory depletion, and customer satisfaction.
   */
  simulateDailyOperations() {
    try {
      const currentDay = this.getCurrentDayName();
      const dailyTraffic = this.simulateCustomerTraffic(currentDay);
      const sales = this.simulateSales(dailyTraffic);
      this.updateInventory(sales);
      this.updateCustomerSatisfaction(dailyTraffic, sales);
      this.calculateRevenue(sales);
      this.calculateWaste();
      this.state.dailySales.push({ day: this.state.day, sales, traffic: dailyTraffic });
      // Evaluate outcomes and adjust strategies via feedback loop
      this.evaluateOutcomesAndAdjustStrategies();
    } catch (error) {
      console.error('Error simulating daily operations:', error.message);
    }
  }

  /**
   * Determines the day name (e.g., Monday) based on the current simulation day.
   * @returns {string} - The name of the current day.
   */
  getCurrentDayName() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[(this.state.day - 1) % 7];
  }

  /**
   * Simulates customer traffic for the day based on the day of the week.
   * @param {string} dayName - The name of the current day.
   * @returns {number} - Number of customers for the day.
   */
  simulateCustomerTraffic(dayName) {
    try {
      // Base traffic with variation based on day of week
      let baseTraffic = 100; // Average daily customers
      if (dayName === 'Friday' || dayName === 'Saturday') {
        baseTraffic *= 1.5; // Weekend boost
      } else if (dayName === 'Monday' || dayName === 'Tuesday') {
        baseTraffic *= 0.8; // Slower weekdays
      }
      // Adjust traffic based on staffing levels (more staff can handle more customers)
      const staffCount = this.state.staffSchedule[dayName]['Lunch'].length + this.state.staffSchedule[dayName]['Dinner'].length;
      const staffFactor = Math.min(1.2, 0.8 + (staffCount * 0.05)); // Up to 20% boost with more staff
      // Adjust traffic based on customer satisfaction
      const satisfactionFactor = Math.min(1.3, Math.max(0.7, this.state.customerSatisfaction)); // Higher satisfaction can increase traffic
      return Math.floor(baseTraffic * staffFactor * satisfactionFactor);
    } catch (error) {
      console.error('Error simulating customer traffic:', error.message);
      return 100; // Default fallback traffic
    }
  }

  /**
   * Simulates sales based on customer traffic and menu prices.
   * @param {number} customerTraffic - Number of customers for the day.
   * @returns {Object} - Sales data for the day.
   */
  simulateSales(customerTraffic) {
    const sales = {};
    try {
      Object.keys(this.state.menuPrices).forEach(item => {
        const priceData = this.state.menuPrices[item];
        // Demand factor influenced by price (higher price reduces demand)
        const priceFactor = Math.max(0.5, 1.5 - (priceData.price / 10.0)); // Simple inverse relationship
        const demand = priceData.demandFactor * priceFactor * (customerTraffic / 100);
        const unitsSold = Math.floor(demand * 10); // Rough scaling to get reasonable sales numbers
        sales[item] = { unitsSold, revenue: unitsSold * priceData.price };
      });
    } catch (error) {
      console.error('Error simulating sales:', error.message);
      // Fallback to zero sales to prevent further errors
      Object.keys(this.state.menuPrices).forEach(item => {
        sales[item] = { unitsSold: 0, revenue: 0.0 };
      });
    }
    return sales;
  }

  /**
   * Updates inventory based on sales.
   * @param {Object} sales - Sales data for the day.
   */
  updateInventory(sales) {
    try {
      // Rough mapping of menu items to inventory for depletion
      const inventoryUsage = {
        'Burger': { 'Chicken': 0.2, 'Tomatoes': 0.1 }, // kg per burger
        'Salad': { 'Lettuce': 0.2, 'Tomatoes': 0.1 }, // kg per salad
        'Soda': {}, // No significant inventory impact
      };

      Object.keys(sales).forEach(item => {
        const usage = inventoryUsage[item] || {};
        const unitsSold = sales[item].unitsSold;
        Object.keys(usage).forEach(ingredient => {
          if (this.state.inventory[ingredient]) {
            this.state.inventory[ingredient].quantity -= usage[ingredient] * unitsSold;
            if (this.state.inventory[ingredient].quantity < 0) {
              this.state.inventory[ingredient].quantity = 0; // Prevent negative inventory
            }
          }
        });
      });
    } catch (error) {
      console.error('Error updating inventory:', error.message);
    }
  }

  /**
   * Updates customer satisfaction based on traffic, sales, and staffing.
   * @param {number} customerTraffic - Number of customers for the day.
   * @param {Object} sales - Sales data for the day.
   */
  updateCustomerSatisfaction(customerTraffic, sales) {
    try {
      // Base satisfaction on staffing levels relative to traffic
      const currentDay = this.getCurrentDayName();
      const staffCount = this.state.staffSchedule[currentDay]['Lunch'].length + this.state.staffSchedule[currentDay]['Dinner'].length;
      const idealStaff = Math.ceil(customerTraffic / 20); // Rough estimate: 1 staff per 20 customers
      const staffingRatio = staffCount / idealStaff;
      let satisfactionAdjustment = 0.0;

      if (staffingRatio < 0.7) {
        satisfactionAdjustment = -0.05; // Understaffed, satisfaction drops
      } else if (staffingRatio > 1.3) {
        satisfactionAdjustment = 0.02; // Overstaffed, slight positive due to better service
      } else {
        satisfactionAdjustment = 0.03; // Well-staffed, positive impact
      }

      // Adjust based on inventory availability (stockouts hurt satisfaction)
      let stockouts = 0;
      Object.keys(this.state.inventory).forEach(item => {
        if (this.state.inventory[item].quantity <= 0) {
          stockouts += 1;
        }
      });
      if (stockouts > 0) {
        satisfactionAdjustment -= 0.03 * stockouts;
      }

      // Adjust based on sales performance (low sales per customer can indicate dissatisfaction)
      let totalUnitsSold = 0;
      Object.keys(sales).forEach(item => {
        totalUnitsSold += sales[item].unitsSold;
      });
      const salesPerCustomer = totalUnitsSold / (customerTraffic || 1);
      if (salesPerCustomer < 0.5) {
        satisfactionAdjustment -= 0.02; // Low sales per customer, possible dissatisfaction
      }

      this.state.customerSatisfaction = Math.max(0.5, Math.min(1.0, this.state.customerSatisfaction + satisfactionAdjustment));
    } catch (error) {
      console.error('Error updating customer satisfaction:', error.message);
    }
  }

  /**
   * Calculates daily revenue from sales.
   * @param {Object} sales - Sales data for the day.
   */
  calculateRevenue(sales) {
    try {
      let dailyRevenue = 0.0;
      Object.keys(sales).forEach(item => {
        dailyRevenue += sales[item].revenue;
      });
      this.state.revenue += dailyRevenue;
    } catch (error) {
      console.error('Error calculating revenue:', error.message);
    }
  }

  /**
   * Calculates labor costs based on current staff schedule.
   */
  calculateLaborCosts() {
    try {
      let weeklyLaborCost = 0.0;
      Object.keys(this.state.staffSchedule).forEach(day => {
        const shifts = this.state.staffSchedule[day];
        Object.keys(shifts).forEach(shift => {
          if (Array.isArray(shifts[shift])) {
            shifts[shift].forEach(staffMember => {
              if (this.state.staffCosts[staffMember]) {
                weeklyLaborCost += this.state.staffCosts[staffMember].hourlyRate * this.state.staffCosts[staffMember].hoursPerShift;
              }
            });
          }
        });
      });
      this.state.costs.labor = weeklyLaborCost;
      this.state.costs.total = this.state.costs.inventory + this.state.costs.labor;
    } catch (error) {
      console.error('Error calculating labor costs:', error.message);
    }
  }

  /**
   * Calculates waste from expired or excess inventory.
   */
  calculateWaste() {
    try {
      // Placeholder for expiry logic (would require current date comparison)
      // For now, assume waste if inventory exceeds a threshold (simulating overstock)
      this.state.waste.items = [];
      this.state.waste.cost = 0.0;
      Object.keys(this.state.inventory).forEach(item => {
        const inventoryItem = this.state.inventory[item];
        if (inventoryItem.quantity > 30) { // Arbitrary threshold for overstock
          const excess = inventoryItem.quantity - 30;
          this.state.waste.items.push({ item, excessQuantity: excess, unit: inventoryItem.unit });
          this.state.waste.cost += excess * inventoryItem.costPerUnit;
          inventoryItem.quantity = 30; // Reduce to threshold
        }
      });
    } catch (error) {
      console.error('Error calculating waste:', error.message);
    }
  }

  /**
   * Runs the full simulation for the specified number of days, fetching AI decisions dynamically if not provided.
   * @param {Object} aiDecisionsPerDay - Predefined AI decisions for each day of the simulation.
   * @param {boolean} fetchDynamicDecisions - Whether to fetch AI decisions dynamically if not provided in aiDecisionsPerDay.
   * @returns {Promise<Object>} - Final state after simulation.
   */
  async runFullSimulation(aiDecisionsPerDay = {}, fetchDynamicDecisions = false) {
    console.log(`Starting full simulation for ${this.state.totalDays} days...`);
    try {
      for (let day = 1; day <= this.state.totalDays; day++) {
        let decisionsForDay = aiDecisionsPerDay[day] || {};
        if (fetchDynamicDecisions && Object.keys(decisionsForDay).length === 0) {
          try {
            console.log(`Fetching dynamic AI decisions for Day ${day}...`);
            decisionsForDay = await this.fetchAIDecisionsForDay(day);
          } catch (error) {
            console.error(`Failed to fetch AI decisions for Day ${day}:`, error.message);
            decisionsForDay = {}; // Proceed with empty decisions if fetch fails
          }
        }
        this.advanceDay(decisionsForDay);
      }
      console.log(`Simulation completed after ${this.state.totalDays} days.`);
    } catch (error) {
      console.error('Error running full simulation:', error.message);
    }
    return this.state;
  }

  /**
   * Fetches AI decisions dynamically for the current day based on the simulation state.
   * @param {number} day - The current day of the simulation.
   * @returns {Promise<Object>} - AI decisions for the day.
   */
  async fetchAIDecisionsForDay(day) {
    const decisions = {};

    try {
      // Prepare input data for inventory management decision
      const inventoryInputData = {
        inventoryData: this.state.inventory,
        salesTrends: this.getSalesTrendsFromHistory(),
        predictedDemand: this.getPredictedDemand(),
        seasonalFactors: this.getSeasonalFactors(day),
        budget: '$500 for inventory order', // Placeholder
        storageCapacity: '100 kg total across all items', // Placeholder
      };

      // Prepare input data for staffing optimization decision
      const staffingInputData = {
        currentSchedule: this.state.staffSchedule,
        trafficPrediction: this.getTrafficPrediction(),
        staffConstraints: this.getStaffConstraints(),
        serviceMetrics: { 'LastWeek': { 'CustomerSatisfaction': `${(this.state.customerSatisfaction * 100).toFixed(1)}%` } },
        laborBudget: '$2000 for the week', // Placeholder
        minStaffPerShift: '2', // Placeholder
        maxHoursPerWeek: '40', // Placeholder
      };

      // Prepare input data for dynamic pricing decision
      const pricingInputData = {
        currentPrices: this.state.menuPrices,
        trafficTrends: this.getTrafficTrends(),
        competitorPricing: this.getCompetitorPricing(), // Placeholder data
        ingredientCosts: this.getIngredientCosts(), // Placeholder data
        maxPriceChange: '10', // Placeholder
        minProfitMargin: '20', // Placeholder
      };

      try {
        decisions['inventory-management'] = await processDecision('inventory-management', inventoryInputData);
      } catch (error) {
        console.error(`Failed to get inventory decision for Day ${day}:`, error.message);
      }

      try {
        decisions['staffing-optimization'] = await processDecision('staffing-optimization', staffingInputData);
      } catch (error) {
        console.error(`Failed to get staffing decision for Day ${day}:`, error.message);
      }

      try {
        decisions['dynamic-pricing'] = await processDecision('dynamic-pricing', pricingInputData);
      } catch (error) {
        console.error(`Failed to get pricing decision for Day ${day}:`, error.message);
      }
    } catch (error) {
      console.error('Error fetching AI decisions:', error.message);
    }

    return decisions;
  }

  /**
   * Extracts sales trends from simulation history for AI input.
   * @returns {Object} - Sales trends based on historical data.
   */
  getSalesTrendsFromHistory() {
    const trends = {};
    try {
      if (this.history.length > 0) {
        const lastDaySales = this.history[this.history.length - 1].state.dailySales;
        if (lastDaySales.length > 0) {
          const latestSales = lastDaySales[lastDaySales.length - 1].sales;
          Object.keys(latestSales).forEach(item => {
            trends[item] = { soldLastWeek: latestSales[item].unitsSold * 7 }; // Rough weekly estimate
          });
        }
      }
      // Default trends if no history
      if (Object.keys(trends).length === 0) {
        trends['Tomatoes'] = { soldLastWeek: 15, unit: 'kg' };
        trends['Lettuce'] = { soldLastWeek: 10, unit: 'kg' };
        trends['Chicken'] = { soldLastWeek: 25, unit: 'kg' };
      }
    } catch (error) {
      console.error('Error getting sales trends from history:', error.message);
      // Fallback to default trends
      trends['Tomatoes'] = { soldLastWeek: 15, unit: 'kg' };
      trends['Lettuce'] = { soldLastWeek: 10, unit: 'kg' };
      trends['Chicken'] = { soldLastWeek: 25, unit: 'kg' };
    }
    return trends;
  }

  /**
   * Generates predicted demand for inventory based on current state and trends.
   * @returns {Object} - Predicted demand for next week.
   */
  getPredictedDemand() {
    const demand = {};
    try {
      const trends = this.getSalesTrendsFromHistory();
      Object.keys(trends).forEach(item => {
        demand[item] = { nextWeek: Math.ceil(trends[item].soldLastWeek * 1.2), unit: trends[item].unit || 'kg' }; // 20% increase as a simple prediction
      });
    } catch (error) {
      console.error('Error getting predicted demand:', error.message);
      // Fallback to default demand
      demand['Tomatoes'] = { nextWeek: 18, unit: 'kg' };
      demand['Lettuce'] = { nextWeek: 12, unit: 'kg' };
      demand['Chicken'] = { nextWeek: 30, unit: 'kg' };
    }
    return demand;
  }

  /**
   * Determines seasonal factors or upcoming events based on the day.
   * @param {number} day - The current day of the simulation.
   * @returns {string} - Seasonal factors or events.
   */
  getSeasonalFactors(day) {
    try {
      // Simple logic for seasonal factors based on day
      if (day % 7 === 6 || day % 7 === 0) { // Weekend simulation
        return 'Weekend expected, increase in demand by 30%.';
      }
      return 'No significant seasonal factors or events.';
    } catch (error) {
      console.error('Error getting seasonal factors:', error.message);
      return 'No significant seasonal factors or events.';
    }
  }

  /**
   * Generates predicted customer traffic for the next week.
   * @returns {Object} - Predicted traffic per day.
   */
  getTrafficPrediction() {
    const prediction = {};
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        prediction[day] = {
          'Lunch': day === 'Friday' || day === 'Saturday' ? 60 : 40,
          'Dinner': day === 'Friday' || day === 'Saturday' ? 100 : 70,
        };
      });
    } catch (error) {
      console.error('Error getting traffic prediction:', error.message);
      // Fallback to default prediction
      prediction['Monday'] = { 'Lunch': 40, 'Dinner': 70 };
      prediction['Tuesday'] = { 'Lunch': 40, 'Dinner': 70 };
      prediction['Wednesday'] = { 'Lunch': 40, 'Dinner': 70 };
      prediction['Thursday'] = { 'Lunch': 40, 'Dinner': 70 };
      prediction['Friday'] = { 'Lunch': 60, 'Dinner': 100 };
      prediction['Saturday'] = { 'Lunch': 60, 'Dinner': 100 };
      prediction['Sunday'] = { 'Lunch': 40, 'Dinner': 70 };
    }
    return prediction;
  }

  /**
   * Generates staff constraints based on current staff costs.
   * @returns {Object} - Staff availability and constraints.
   */
  getStaffConstraints() {
    const constraints = {};
    try {
      Object.keys(this.state.staffCosts).forEach(staff => {
        constraints[staff] = {
          maxHours: 40,
          available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        };
      });
    } catch (error) {
      console.error('Error getting staff constraints:', error.message);
      // Fallback to default constraints
      constraints['Alice'] = { maxHours: 40, available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
      constraints['Bob'] = { maxHours: 40, available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
      constraints['Charlie'] = { maxHours: 40, available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
      constraints['Dana'] = { maxHours: 40, available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
      constraints['Eve'] = { maxHours: 40, available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
    }
    return constraints;
  }

  /**
   * Generates traffic trends for menu items based on historical sales.
   * @returns {Object} - Traffic and demand trends for menu items.
   */
  getTrafficTrends() {
    const trends = {};
    try {
      if (this.history.length > 0 && this.history[this.history.length - 1].state.dailySales.length > 0) {
        const lastSales = this.history[this.history.length - 1].state.dailySales[this.history[this.history.length - 1].state.dailySales.length - 1].sales;
        Object.keys(lastSales).forEach(item => {
          trends[item] = {
            demand: lastSales[item].unitsSold > 50 ? 'high' : (lastSales[item].unitsSold > 20 ? 'moderate' : 'low'),
            soldLastWeek: lastSales[item].unitsSold * 7, // Rough estimate
          };
        });
      } else {
        // Default if no history
        trends['Burger'] = { demand: 'high during dinner', soldLastWeek: 200 };
        trends['Salad'] = { demand: 'moderate', soldLastWeek: 100 };
        trends['Soda'] = { demand: 'steady', soldLastWeek: 300 };
      }
    } catch (error) {
      console.error('Error getting traffic trends:', error.message);
      // Fallback to default trends
      trends['Burger'] = { demand: 'high during dinner', soldLastWeek: 200 };
      trends['Salad'] = { demand: 'moderate', soldLastWeek: 100 };
      trends['Soda'] = { demand: 'steady', soldLastWeek: 300 };
    }
    return trends;
  }

  /**
   * Placeholder for competitor pricing data.
   * @returns {Object} - Competitor pricing data.
   */
  getCompetitorPricing() {
    try {
      return {
        'Burger': { avgPrice: 11.50 },
        'Salad': { avgPrice: 8.50 },
        'Soda': { avgPrice: 3.00 },
      };
    } catch (error) {
      console.error('Error getting competitor pricing:', error.message);
      return {
        'Burger': { avgPrice: 11.50 },
        'Salad': { avgPrice: 8.50 },
        'Soda': { avgPrice: 3.00 },
      };
    }
  }

  /**
   * Placeholder for ingredient cost changes based on current inventory costs.
   * @returns {Object} - Ingredient cost change data.
   */
  getIngredientCosts() {
    try {
      return {
        'Burger': { costIncrease: '5% due to beef price rise' },
        'Salad': { costDecrease: '3% due to seasonal vegetables' },
        'Soda': { costStable: 'no change' },
      };
    } catch (error) {
      console.error('Error getting ingredient costs:', error.message);
      return {
        'Burger': { costIncrease: '5% due to beef price rise' },
        'Salad': { costDecrease: '3% due to seasonal vegetables' },
        'Soda': { costStable: 'no change' },
      };
    }
  }

  /**
   * Retrieves the simulation history.
   * @returns {Array} - Array of daily states.
   */
  getHistory() {
    return this.history;
  }

  /**
   * Evaluates decision outcomes and adjusts strategies based on predefined metrics.
   */
  evaluateOutcomesAndAdjustStrategies() {
    try {
      // Metrics for evaluation
      const revenueImpact = this.state.revenue - (this.history.length > 1 ? this.history[this.history.length - 2].state.revenue : 0);
      const wasteCost = this.state.waste.cost;
      const customerSatisfactionChange = this.state.customerSatisfaction - (this.history.length > 1 ? this.history[this.history.length - 2].state.customerSatisfaction : this.state.customerSatisfaction);
      const inventoryShortage = Object.values(this.state.inventory).some(item => item.quantity <= 0);

      // Log evaluation results
      console.log(`Day ${this.state.day} Evaluation: Revenue Impact = $${revenueImpact.toFixed(2)}, Waste Cost = $${wasteCost.toFixed(2)}, Customer Satisfaction Change = ${(customerSatisfactionChange * 100).toFixed(1)}%, Inventory Shortage = ${inventoryShortage ? 'Yes' : 'No'}`);

      // Adjust strategies based on outcomes
      if (revenueImpact < 0 || customerSatisfactionChange < -0.05) {
        // Negative impact detected, adjust demand factors for pricing
        Object.keys(this.state.menuPrices).forEach(item => {
          if (this.state.menuPrices[item].price > this.state.menuPrices[item].costToMake * 2) {
            // Reduce price slightly to boost demand if markup is high
            this.state.menuPrices[item].price = Math.max(this.state.menuPrices[item].costToMake * 1.5, this.state.menuPrices[item].price - 0.50);
            console.log(`Feedback Loop: Reduced price of ${item} to $${this.state.menuPrices[item].price.toFixed(2)} to improve revenue/customer satisfaction.`);
          }
        });
      }

      if (wasteCost > 50) {
        // High waste detected, adjust inventory ordering strategy
        Object.keys(this.state.inventory).forEach(item => {
          if (this.state.inventory[item].quantity > 20) {
            // Reduce future over-ordering by marking a note in state (to be used by AI)
            this.state.inventory[item].note = 'Reduce order quantity to avoid waste.';
            console.log(`Feedback Loop: Noted to reduce order quantity for ${item} due to high waste (current quantity: ${this.state.inventory[item].quantity}).`);
          }
        });
      }

      if (inventoryShortage) {
        // Stockouts detected, increase demand prediction for next order
        Object.keys(this.state.inventory).forEach(item => {
          if (this.state.inventory[item].quantity <= 0) {
            this.state.inventory[item].note = 'Increase order quantity to prevent stockouts.';
            console.log(`Feedback Loop: Noted to increase order quantity for ${item} due to stockout.`);
          }
        });
      }

      if (customerSatisfactionChange < -0.03) {
        // Customer satisfaction drop detected, check staffing
        const currentDay = this.getCurrentDayName();
        const staffCount = this.state.staffSchedule[currentDay]['Lunch'].length + this.state.staffSchedule[currentDay]['Dinner'].length;
        if (staffCount < 4) {
          // Suggest increasing staff for next similar day
          const note = `Increase staff for ${currentDay} to improve customer satisfaction.`;
          if (!this.state.staffSchedule[currentDay].notes) {
            this.state.staffSchedule[currentDay].notes = [];
          }
          this.state.staffSchedule[currentDay].notes.push(note);
          console.log(`Feedback Loop: ${note}`);
        }
      }
    } catch (error) {
      console.error('Error evaluating outcomes and adjusting strategies:', error.message);
    }
  }

  /**
   * Retrieves the current state of the simulation.
   * @returns {Object} - Current state.
   */
  getCurrentState() {
    return this.state;
  }
}

// Export the SimulationEngine class for use in other modules
module.exports = SimulationEngine;

// Example usage (for testing purposes)
if (require.main === module) {
  console.log('Testing Simulation Engine...');
  const engine = new SimulationEngine();
  console.log('Initial State Summary:', {
    day: engine.getCurrentState().day,
    inventory: Object.keys(engine.getCurrentState().inventory).map(item => `${item}: ${engine.getCurrentState().inventory[item].quantity} ${engine.getCurrentState().inventory[item].unit}`),
    revenue: engine.getCurrentState().revenue,
    customerSatisfaction: `${(engine.getCurrentState().customerSatisfaction * 100).toFixed(1)}%`,
  });
  engine.advanceDay();
  console.log('State Summary after Day 1:', {
    day: engine.getCurrentState().day,
    inventory: Object.keys(engine.getCurrentState().inventory).map(item => `${item}: ${engine.getCurrentState().inventory[item].quantity} ${engine.getCurrentState().inventory[item].unit}`),
    revenue: engine.getCurrentState().revenue,
    customerSatisfaction: `${(engine.getCurrentState().customerSatisfaction * 100).toFixed(1)}%`,
  });
  console.log('Running Full Simulation for 3 Days (without dynamic AI decisions)...');
  const newEngine = new SimulationEngine({ totalDays: 3 });
  newEngine.runFullSimulation().then(finalState => {
    console.log('Full Simulation Completed. Final State Summary:', {
      day: finalState.day,
      revenue: finalState.revenue,
      costs: finalState.costs,
      customerSatisfaction: `${(finalState.customerSatisfaction * 100).toFixed(1)}%`,
    });
    console.log('Note: To test with dynamic AI decisions, set fetchDynamicDecisions to true and ensure Gemini API key is configured.');
  }).catch(error => {
    console.error('Full Simulation Failed:', error.message);
  });
}
