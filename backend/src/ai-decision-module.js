// Restaurant Revenue Rocket - AI Decision-Making Module
// This module integrates with the Gemini API to make autonomous decisions for restaurant management scenarios.
// It includes fallback logic for when the API is unavailable and handles edge cases for robust operation.

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables for API configuration
dotenv.config();

// Gemini API configuration
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://api.gemini.com/v2';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_MAX_TOKENS = parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 2048;
const GEMINI_TEMPERATURE = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7;

// Default configuration for AI decision-making
const DEFAULT_SCENARIO = 'inventory-management';
const DEFAULT_PROMPT_TEMPLATE_INVENTORY = `
You are an AI assistant managing a restaurant's inventory. Based on the following data, decide what items to order, in what quantities, and when to ensure optimal stock levels without overstocking or stockouts.

Current Inventory Data:
{inventoryData}

Sales Trends (last 7 days):
{salesTrends}

Predicted Demand (next 7 days):
{predictedDemand}

Seasonal Factors or Upcoming Events:
{seasonalFactors}

Constraints:
- Budget for inventory order: {budget}
- Storage capacity: {storageCapacity}
- Minimize waste by avoiding overstock of perishable items.

Provide a detailed decision on inventory ordering, including:
1. Items to order and quantities.
2. Timing of the order (e.g., immediate, next day).
3. Rationale for the decision based on the data provided.
4. Expected impact on revenue and cost.

Format your response as JSON:
{
  "decision": {
    "itemsToOrder": [
      {"item": "string", "quantity": number, "unit": "string"},
      ...
    ],
    "orderTiming": "string",
    "rationale": "string",
    "expectedImpact": {
      "revenue": "string",
      "cost": "string"
    }
  }
}
`;

const DEFAULT_PROMPT_TEMPLATE_STAFFING = `
You are an AI assistant managing a restaurant's staffing schedule. Based on the following data, decide the optimal staff schedule to ensure adequate coverage during peak times while minimizing labor costs during slow periods.

Current Staff Schedule:
{currentSchedule}

Predicted Customer Traffic (next 7 days):
{trafficPrediction}

Staff Availability and Constraints:
{staffConstraints}

Historical Service Quality Metrics:
{serviceMetrics}

Constraints:
- Labor budget: {laborBudget}
- Minimum staff required per shift for safety and service: {minStaffPerShift}
- Ensure staff satisfaction by avoiding overworking (max hours per week: {maxHoursPerWeek}).

Provide a detailed decision on staff scheduling, including:
1. Staff assignments per shift for the next 7 days.
2. Rationale for the scheduling decisions based on the data provided.
3. Expected impact on service quality and labor cost.

Format your response as JSON:
{
  "decision": {
    "schedule": [
      {"day": "string", "shift": "string", "staffAssigned": ["string", ...]},
      ...
    ],
    "rationale": "string",
    "expectedImpact": {
      "serviceQuality": "string",
      "laborCost": "string"
    }
  }
}
`;

const DEFAULT_PROMPT_TEMPLATE_PRICING = `
You are an AI assistant managing a restaurant's menu pricing. Based on the following data, decide how to adjust menu item prices to maximize revenue while maintaining customer satisfaction.

Current Menu Prices:
{currentPrices}

Customer Traffic and Demand Trends (last 7 days):
{trafficTrends}

Competitor Pricing Data:
{competitorPricing}

Ingredient Cost Changes:
{ingredientCosts}

Constraints:
- Price changes should not exceed {maxPriceChange}% to avoid customer dissatisfaction.
- Maintain a minimum profit margin of {minProfitMargin}% per item.
- Consider time-based pricing (e.g., happy hour discounts) if applicable.

Provide a detailed decision on menu pricing adjustments, including:
1. Items with price changes and new prices.
2. Timing of price adjustments (e.g., immediate, specific day/time).
3. Rationale for the pricing decisions based on the data provided.
4. Expected impact on revenue and customer satisfaction.

Format your response as JSON:
{
  "decision": {
    "priceAdjustments": [
      {"item": "string", "currentPrice": number, "newPrice": number, "unit": "string"},
      ...
    ],
    "adjustmentTiming": "string",
    "rationale": "string",
    "expectedImpact": {
      "revenue": "string",
      "customerSatisfaction": "string"
    }
  }
}
`;

/**
 * Makes a decision using the Gemini API for a given restaurant management scenario.
 * @param {string} scenario - The scenario for decision-making (e.g., 'inventory-management').
 * @param {Object} inputData - The input data relevant to the scenario.
 * @returns {Promise<Object>} - The decision output from the AI model or fallback logic.
 */
async function makeDecision(scenario = DEFAULT_SCENARIO, inputData = {}) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key is not configured. Using fallback logic for decision-making.');
      return fallbackDecisionLogic(scenario, inputData);
    }

    // Construct the prompt based on the scenario
    let prompt = '';
    if (scenario === 'inventory-management') {
      prompt = DEFAULT_PROMPT_TEMPLATE_INVENTORY
        .replace('{inventoryData}', JSON.stringify(inputData.inventoryData || {}, null, 2))
        .replace('{salesTrends}', JSON.stringify(inputData.salesTrends || {}, null, 2))
        .replace('{predictedDemand}', JSON.stringify(inputData.predictedDemand || {}, null, 2))
        .replace('{seasonalFactors}', inputData.seasonalFactors || 'None')
        .replace('{budget}', inputData.budget || 'Not specified')
        .replace('{storageCapacity}', inputData.storageCapacity || 'Not specified');
    } else if (scenario === 'staffing-optimization') {
      prompt = DEFAULT_PROMPT_TEMPLATE_STAFFING
        .replace('{currentSchedule}', JSON.stringify(inputData.currentSchedule || {}, null, 2))
        .replace('{trafficPrediction}', JSON.stringify(inputData.trafficPrediction || {}, null, 2))
        .replace('{staffConstraints}', JSON.stringify(inputData.staffConstraints || {}, null, 2))
        .replace('{serviceMetrics}', JSON.stringify(inputData.serviceMetrics || {}, null, 2))
        .replace('{laborBudget}', inputData.laborBudget || 'Not specified')
        .replace('{minStaffPerShift}', inputData.minStaffPerShift || 'Not specified')
        .replace('{maxHoursPerWeek}', inputData.maxHoursPerWeek || 'Not specified');
    } else if (scenario === 'dynamic-pricing') {
      prompt = DEFAULT_PROMPT_TEMPLATE_PRICING
        .replace('{currentPrices}', JSON.stringify(inputData.currentPrices || {}, null, 2))
        .replace('{trafficTrends}', JSON.stringify(inputData.trafficTrends || {}, null, 2))
        .replace('{competitorPricing}', JSON.stringify(inputData.competitorPricing || {}, null, 2))
        .replace('{ingredientCosts}', JSON.stringify(inputData.ingredientCosts || {}, null, 2))
        .replace('{maxPriceChange}', inputData.maxPriceChange || '10')
        .replace('{minProfitMargin}', inputData.minProfitMargin || '20');
    } else {
      console.error(`Unsupported scenario: ${scenario}. Using fallback logic.`);
      return fallbackDecisionLogic(scenario, inputData);
    }

    // Make request to Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: GEMINI_MAX_TOKENS,
          temperature: GEMINI_TEMPERATURE,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // Set a timeout of 10 seconds to handle API delays
      }
    ).catch(error => {
      if (error.code === 'ECONNABORTED') {
        console.error('Gemini API request timed out after 10 seconds. Falling back to rule-based logic.');
        return fallbackDecisionLogic(scenario, inputData);
      }
      throw error;
    });

    // Parse and return the AI's decision
    const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
      const parsedResponse = JSON.parse(responseText);
      if (!parsedResponse.decision || !parsedResponse.decision.rationale) {
        console.warn('Incomplete response from Gemini API. Falling back to rule-based logic.');
        return fallbackDecisionLogic(scenario, inputData);
      }
      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse Gemini API response as JSON:', responseText);
      console.warn('Falling back to rule-based logic due to invalid JSON response.');
      return fallbackDecisionLogic(scenario, inputData);
    }
  } catch (error) {
    console.error(`Error in makeDecision for scenario '${scenario}':`, error.message);
    console.warn('Falling back to rule-based logic due to API error.');
    return fallbackDecisionLogic(scenario, inputData);
  }
}

/**
 * Fallback decision logic when Gemini API is unavailable or fails.
 * @param {string} scenario - The scenario for decision-making.
 * @param {Object} inputData - The input data for the scenario.
 * @returns {Object} - A rule-based decision result.
 */
function fallbackDecisionLogic(scenario, inputData) {
  console.log(`Using fallback logic for scenario: ${scenario}`);

  if (scenario === 'inventory-management') {
    // Simple rule: Order enough to cover predicted demand minus current inventory, if data is available
    const currentInventory = inputData.inventoryData || {};
    const predictedDemand = inputData.predictedDemand || {};
    const itemsToOrder = [];

    // Iterate through items in predicted demand
    for (const [item, demand] of Object.entries(predictedDemand)) {
      const current = currentInventory[item] || { quantity: 0, unit: demand.unit || 'units' };
      const shortfall = (demand.nextWeek || demand.quantity || 0) - current.quantity;
      if (shortfall > 0) {
        itemsToOrder.push({
          item: item,
          quantity: Math.ceil(shortfall),
          unit: demand.unit || current.unit || 'units'
        });
      }
    }

    return {
      decision: {
        itemsToOrder: itemsToOrder,
        orderTiming: itemsToOrder.length > 0 ? 'immediate' : 'not needed',
        rationale: "Fallback logic: Ordered items to cover predicted demand shortfall based on current inventory levels. If no shortfall, no order is placed.",
        expectedImpact: {
          revenue: itemsToOrder.length > 0 ? "Positive due to avoiding stockouts" : "Neutral, no action taken",
          cost: itemsToOrder.length > 0 ? "Increased due to inventory purchase" : "Neutral, no cost incurred"
        }
      }
    };
  } else if (scenario === 'staffing-optimization') {
    // Simple rule: Adjust staff based on predicted traffic with safety bounds
    const predictedTraffic = inputData.trafficPrediction || {};
    const currentStaff = inputData.currentSchedule || {};
    const schedule = [];
    let dayCount = 0;

    // Default to a minimum safe staff level if no data is available
    let baseStaffCount = 4; // Default staff count

    // Check if traffic prediction has data for at least one day
    if (Object.keys(predictedTraffic).length > 0) {
      for (const [day, traffic] of Object.entries(predictedTraffic)) {
        if (dayCount >= 7) break; // Limit to 7 days
        let staffCount = baseStaffCount;
        if (traffic.Lunch && traffic.Dinner) {
          const avgTraffic = (traffic.Lunch + traffic.Dinner) / 2;
          if (avgTraffic > 70) {
            staffCount = Math.min(baseStaffCount + 2, 8); // Cap at 8 staff for high traffic
          } else if (avgTraffic < 40) {
            staffCount = Math.max(baseStaffCount - 1, 2); // Minimum 2 staff for low traffic
          }
        }
        schedule.push({
          day: day,
          shift: "Lunch",
          staffAssigned: Array(Math.ceil(staffCount * 0.6)).fill("TBD")
        });
        schedule.push({
          day: day,
          shift: "Dinner",
          staffAssigned: Array(Math.ceil(staffCount * 0.4)).fill("TBD")
        });
        dayCount++;
      }
    } else {
      // If no traffic data, create a default schedule for 7 days
      for (let i = 1; i <= 7; i++) {
        const day = `Day ${i}`;
        schedule.push({
          day: day,
          shift: "Lunch",
          staffAssigned: Array(Math.ceil(baseStaffCount * 0.6)).fill("TBD")
        });
        schedule.push({
          day: day,
          shift: "Dinner",
          staffAssigned: Array(Math.ceil(baseStaffCount * 0.4)).fill("TBD")
        });
      }
    }

    return {
      decision: {
        schedule: schedule,
        rationale: "Fallback logic: Scheduled staff based on predicted traffic with safety bounds (2-8 staff per shift). If no data, used default staffing levels.",
        expectedImpact: {
          serviceQuality: predictedTraffic && Object.keys(predictedTraffic).length > 0 ? "Stable with adjusted staffing for traffic" : "Stable with default staffing",
          laborCost: predictedTraffic && Object.keys(predictedTraffic).length > 0 ? "Adjusted based on traffic predictions" : "Neutral with default staffing"
        }
      }
    };
  } else if (scenario === 'dynamic-pricing') {
    // Simple rule: Adjust prices based on traffic trends with constraints
    const currentPrices = inputData.currentPrices || {};
    const trafficTrends = inputData.trafficTrends || {};
    const priceAdjustments = [];
    const maxPriceChange = parseFloat(inputData.maxPriceChange) || 10; // Default max change 10%

    for (const [item, data] of Object.entries(trafficTrends)) {
      if (currentPrices[item]) {
        let multiplier = 1.0;
        if (data.demand && data.demand.includes('high')) {
          multiplier = 1 + (maxPriceChange / 100); // Increase up to max allowed
        } else if (data.demand && data.demand.includes('low')) {
          multiplier = 1 - (maxPriceChange / 200); // Decrease by half of max to be conservative
        }
        const newPrice = parseFloat((currentPrices[item].price * multiplier).toFixed(2));
        priceAdjustments.push({
          item: item,
          currentPrice: currentPrices[item].price,
          newPrice: newPrice,
          unit: currentPrices[item].unit || 'each'
        });
      }
    }

    return {
      decision: {
        priceAdjustments: priceAdjustments,
        adjustmentTiming: priceAdjustments.length > 0 ? 'immediate' : 'not needed',
        rationale: `Fallback logic: Adjusted prices based on demand trends with a maximum change of ${maxPriceChange}%. High demand increases price, low demand decreases conservatively.`,
        expectedImpact: {
          revenue: priceAdjustments.length > 0 ? "Potentially increased with demand-based pricing" : "Neutral, no adjustments made",
          customerSatisfaction: priceAdjustments.length > 0 ? "Slightly variable due to price changes" : "Neutral, no changes"
        }
      }
    };
  } else {
    return {
      decision: {
        error: `Unsupported scenario: ${scenario}`,
        action: "No action taken due to unrecognized scenario."
      },
      rationale: "Fallback logic failed: Scenario not recognized. Please use 'inventory-management', 'staffing-optimization', or 'dynamic-pricing'.",
      expectedImpact: {
        revenue: "Neutral, no action taken",
        cost: "Neutral, no action taken"
      }
    };
  }
}

/**
 * Logs the decision to a database or file for future reference (placeholder for database integration).
 * @param {string} scenario - The scenario for which the decision was made.
 * @param {Object} inputData - The input data used for the decision.
 * @param {Object} decision - The decision output from the AI model or fallback logic.
 */
async function logDecision(scenario, inputData, decision) {
  // Placeholder for database integration with PostgreSQL
  console.log(`Logging decision for scenario '${scenario}':`, {
    inputData,
    decision,
    timestamp: new Date().toISOString(),
  });
  // Future implementation will store this in PostgreSQL as per Week 5, Day 4-5 tasks.
  return true;
}

/**
 * Main function to process a decision for a given scenario, including logging.
 * @param {string} scenario - The scenario for decision-making.
 * @param {Object} inputData - The input data for the scenario.
 * @returns {Promise<Object>} - The final decision result.
 */
async function processDecision(scenario = DEFAULT_SCENARIO, inputData = {}) {
  try {
    // Validate input data to prevent downstream errors
    if (!inputData || typeof inputData !== 'object') {
      console.warn('Invalid or missing input data for decision processing. Using empty object as default.');
      inputData = {};
    }

    const decision = await makeDecision(scenario, inputData);
    await logDecision(scenario, inputData, decision);
    return decision;
  } catch (error) {
    console.error(`Failed to process decision for scenario '${scenario}':`, error.message);
    // Provide a fallback decision even in case of unexpected errors during processing
    const fallbackResult = fallbackDecisionLogic(scenario, inputData);
    fallbackResult.decision.error = fallbackResult.decision.error || `Processing error: ${error.message}`;
    fallbackResult.rationale = `Fallback applied due to processing error: ${error.message}. ${fallbackResult.rationale}`;
    return fallbackResult;
  }
}

// Export the main functions for use in other modules
module.exports = {
  makeDecision,
  logDecision,
  processDecision,
};

// Example usage (for testing purposes)
if (require.main === module) {
  const testInputDataInventory = {
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

  const testInputDataStaffing = {
    currentSchedule: {
      'Monday': { 'Lunch': ['Alice', 'Bob'], 'Dinner': ['Charlie', 'Dana'] },
      'Tuesday': { 'Lunch': ['Alice', 'Eve'], 'Dinner': ['Bob', 'Dana'] },
    },
    trafficPrediction: {
      'Monday': { 'Lunch': 50, 'Dinner': 80 },
      'Tuesday': { 'Lunch': 40, 'Dinner': 70 },
    },
    staffConstraints: {
      'Alice': { maxHours: 40, available: ['Monday', 'Tuesday'] },
      'Bob': { maxHours: 30, available: ['Monday', 'Tuesday'] },
    },
    serviceMetrics: {
      'LastWeek': { 'CustomerSatisfaction': '85%', 'WaitTime': '10 minutes avg' },
    },
    laborBudget: '$2000 for the week',
    minStaffPerShift: '2',
    maxHoursPerWeek: '40',
  };

  const testInputDataPricing = {
    currentPrices: {
      'Burger': { price: 10.99, unit: 'each' },
      'Salad': { price: 8.99, unit: 'each' },
      'Soda': { price: 2.99, unit: 'each' },
    },
    trafficTrends: {
      'Burger': { demand: 'high during dinner', soldLastWeek: 200 },
      'Salad': { demand: 'moderate', soldLastWeek: 100 },
      'Soda': { demand: 'steady', soldLastWeek: 300 },
    },
    competitorPricing: {
      'Burger': { avgPrice: 11.50 },
      'Salad': { avgPrice: 8.50 },
      'Soda': { avgPrice: 3.00 },
    },
    ingredientCosts: {
      'Burger': { costIncrease: '5% due to beef price rise' },
      'Salad': { costDecrease: '3% due to seasonal vegetables' },
      'Soda': { costStable: 'no change' },
    },
    maxPriceChange: '10',
    minProfitMargin: '20',
  };

  console.log('Testing AI Decision-Making Module for Inventory Management...');
  processDecision('inventory-management', testInputDataInventory)
    .then(result => console.log('Inventory Decision Result:', JSON.stringify(result, null, 2)))
    .catch(error => console.error('Inventory Test Failed:', error.message));

  console.log('Testing AI Decision-Making Module for Staffing Optimization...');
  processDecision('staffing-optimization', testInputDataStaffing)
    .then(result => console.log('Staffing Decision Result:', JSON.stringify(result, null, 2)))
    .catch(error => console.error('Staffing Test Failed:', error.message));

  console.log('Testing AI Decision-Making Module for Dynamic Pricing...');
  processDecision('dynamic-pricing', testInputDataPricing)
    .then(result => console.log('Pricing Decision Result:', JSON.stringify(result, null, 2)))
    .catch(error => console.error('Pricing Test Failed:', error.message));
}
