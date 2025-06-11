import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DecisionImpactGraph = ({ data }) => {
  // Sample data format: [{ day: 'Day 1', revenue: 4000, satisfaction: 80 }, ...]
  // If no data is provided, use sample data for demonstration
  const sampleData = [
    { day: 'Day 1', revenue: 4000, satisfaction: 80 },
    { day: 'Day 2', revenue: 3000, satisfaction: 75 },
    { day: 'Day 3', revenue: 5000, satisfaction: 85 },
    { day: 'Day 4', revenue: 4500, satisfaction: 82 },
    { day: 'Day 5', revenue: 6000, satisfaction: 90 },
  ];

  const chartData = data && data.length > 0 ? data : sampleData;

  return (
    <div className="decision-impact-graph">
      <h2>Decision Impact Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis yAxisId="left" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Satisfaction (%)', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
          <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#82ca9d" name="Customer Satisfaction" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DecisionImpactGraph;
