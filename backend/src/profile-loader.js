const fs = require('fs');
const path = require('path');

/**
 * Loads demo profiles from JSON files and applies AI behavior parameters.
 * @returns {Object} An object containing all loaded profiles.
 */
function loadDemoProfiles() {
  const profilesDir = path.join(__dirname, '../../frontend/public/assets/data/demo-profiles');
  const profiles = {};

  try {
    const files = fs.readdirSync(profilesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(profilesDir, file);
        const profileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        profiles[profileData.id] = profileData;
        console.log(`Loaded profile: ${profileData.id}`);
      }
    });
  } catch (error) {
    console.error('Error loading demo profiles:', error);
  }

  return profiles;
}

/**
 * Applies AI behavior parameters from a profile to initialize a scenario.
 * @param {Object} profile - The profile object containing AI behavior parameters.
 * @returns {Object} Configuration object for AI decision-making based on profile.
 */
function applyAIBehaviorParameters(profile) {
  if (!profile.aiBehavior) {
    console.warn(`No AI behavior parameters found in profile: ${profile.id}`);
    return {};
  }

  const { priority, decisionWeights, responseTime, adjustmentFrequency, inventoryThresholds, pricingStrategy, staffingStrategy } = profile.aiBehavior;

  // Configuration object to be used by AI decision-making modules
  const aiConfig = {
    priority,
    decisionWeights,
    responseTime,
    adjustmentFrequency,
    inventoryThresholds,
    pricingStrategy,
    staffingStrategy
  };

  console.log(`Applied AI behavior parameters for profile: ${profile.id}`);
  return aiConfig;
}

module.exports = {
  loadDemoProfiles,
  applyAIBehaviorParameters
};
