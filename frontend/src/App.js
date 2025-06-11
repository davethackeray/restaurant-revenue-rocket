import React, { useEffect } from 'react';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAIDecisions } from './redux/aiDecisionsSlice';
import { fetchSimulationState, advanceSimulationDay, evaluateSimulation, resetSimulation } from './redux/simulationSlice';
import DecisionImpactGraph from './components/DecisionImpactGraph';
import InventoryLevelGraph from './components/InventoryLevelGraph';
import SimulationDetails from './components/SimulationDetails';

function App() {
  const dispatch = useDispatch();
  const aiDecisions = useSelector((state) => state.aiDecisions.decisions);
  const aiLoading = useSelector((state) => state.aiDecisions.loading);
  const aiError = useSelector((state) => state.aiDecisions.error);
  const simulationState = useSelector((state) => state.simulation.state);
  const simulationHistory = useSelector((state) => state.simulation.history);
  const simulationOutcomes = useSelector((state) => state.simulation.outcomes);
  const simLoading = useSelector((state) => state.simulation.loading);
  const simError = useSelector((state) => state.simulation.error);

  useEffect(() => {
    dispatch(fetchAIDecisions());
  }, [dispatch]);

  const handleStartSimulation = () => {
    dispatch(fetchSimulationState('quick-service'));
  };

  const handleAdvanceDay = () => {
    if (simulationState) {
      dispatch(advanceSimulationDay(simulationState));
      dispatch(evaluateSimulation(simulationState));
    }
  };

  const handleResetSimulation = () => {
    dispatch(resetSimulation());
  };

  // Prepare data for the graph from simulation outcomes
  const graphData = simulationOutcomes.map(outcome => ({
    day: outcome.day,
    revenue: outcome.revenueImpact,
    satisfaction: simulationHistory.length > outcome.day - 1 ? simulationHistory[outcome.day - 1].customerSatisfaction : 80 + outcome.satisfactionChange,
  }));

  return (
    <div className="App">
      <header className="App-header">
        <h1>Restaurant Revenue Rocket</h1>
        <p>AI-Driven Restaurant Management Simulation</p>
      </header>
      <main>
        {aiLoading && <p>Loading AI Decisions...</p>}
        {aiError && <p>Error: {aiError}</p>}
        {!aiLoading && !aiError && (
          <>
            <div className="decision-container">
              <h2>AI Decisions</h2>
              {aiDecisions.length > 0 ? (
                <ul className="decision-list">
                  {aiDecisions.map((decision, index) => (
                    <li key={index} className="decision-item">
                      <h3>{decision.type}</h3>
                      <p>{decision.description}</p>
                      <p>Impact: {decision.impact}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No AI decisions available yet.</p>
              )}
            </div>
            <div className="decision-container">
              <h2>Simulation Control</h2>
              {simLoading && <p>Loading Simulation...</p>}
              {simError && <p>Simulation Error: {simError}</p>}
              {!simLoading && !simError && (
                <>
                  {!simulationState ? (
                    <button onClick={handleStartSimulation}>Start Simulation (Quick Service)</button>
                  ) : (
                    <>
                      <p>Current Day: {simulationState.day}</p>
                      <p>Revenue: ${simulationState.revenue}</p>
                      <p>Customer Satisfaction: {simulationState.customerSatisfaction}%</p>
                      <button onClick={handleAdvanceDay}>Advance Day</button>
                      <button onClick={handleResetSimulation} style={{ marginLeft: '10px' }}>Reset Simulation</button>
                    </>
                  )}
                </>
              )}
            </div>
            <SimulationDetails simulationState={simulationState} simulationHistory={simulationHistory} />
            <DecisionImpactGraph data={graphData} />
            <InventoryLevelGraph data={graphData} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
