import React from 'react';
import '../App.css';

const SimulationDetails = ({ simulationState, simulationHistory }) => {
  if (!simulationState) {
    return (
      <div className="decision-container">
        <h2>Simulation Details</h2>
        <p>No active simulation. Start a new simulation to view details.</p>
      </div>
    );
  }

  // Calculate averages or trends if history is available
  let revenueTrend = 'N/A';
  let satisfactionTrend = 'N/A';
  if (simulationHistory.length > 1) {
    const lastTwoStates = simulationHistory.slice(-2);
    revenueTrend = lastTwoStates[1].revenue > lastTwoStates[0].revenue ? 'Increasing' : lastTwoStates[1].revenue < lastTwoStates[0].revenue ? 'Decreasing' : 'Stable';
    satisfactionTrend = lastTwoStates[1].customerSatisfaction > lastTwoStates[0].customerSatisfaction ? 'Increasing' : lastTwoStates[1].customerSatisfaction < lastTwoStates[0].customerSatisfaction ? 'Decreasing' : 'Stable';
  }

  return (
    <div className="decision-container">
      <h2>Simulation Details</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: '1', minWidth: '200px', margin: '5px' }}>
          <h3>Current State</h3>
          <p><strong>Day:</strong> {simulationState.day}</p>
          <p><strong>Revenue:</strong> ${simulationState.revenue}</p>
          <p><strong>Customer Satisfaction:</strong> {simulationState.customerSatisfaction}%</p>
          <p><strong>Inventory Level:</strong> {simulationState.inventoryLevel}</p>
          <p><strong>Staff Count:</strong> {simulationState.staffCount}</p>
        </div>
        <div style={{ flex: '1', minWidth: '200px', margin: '5px' }}>
          <h3>Trends</h3>
          <p><strong>Revenue Trend:</strong> {revenueTrend}</p>
          <p><strong>Satisfaction Trend:</strong> {satisfactionTrend}</p>
        </div>
        <div style={{ flex: '1', minWidth: '200px', margin: '5px' }}>
          <h3>Recent Decisions</h3>
          {simulationState.recentDecisions && simulationState.recentDecisions.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              {simulationState.recentDecisions.slice(-3).map((decision, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>
                  <strong>{decision.type}</strong>: {decision.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent decisions recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationDetails;
