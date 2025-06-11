import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InventoryLevelGraph = ({ data }) => {
  // Sample data format: [{ day: 'Day 1', inventory: 500 }, ...]
  // If no data is provided, use sample data for demonstration
  const sampleData = [
    { day: 'Day 1', inventory: 500 },
    { day: 'Day 2', inventory: 450 },
    { day: 'Day 3', inventory: 480 },
    { day: 'Day 4', inventory: 420 },
    { day: 'Day 5', inventory: 510 },
  ];

  const chartData = data && data.length > 0 ? data : sampleData;

  return (
    <div className="inventory-level-graph">
      <h2>Inventory Levels Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis label={{ value: 'Inventory (units)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="inventory" fill="#ffc658" name="Inventory" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InventoryLevelGraph;
