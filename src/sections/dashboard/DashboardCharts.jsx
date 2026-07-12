
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '12.5px'
      }}>
        <p style={{ fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{payload[0].payload.month}</p>
        <p style={{ margin: '0 0 4px 0', color: 'var(--success)' }}>
          Ingresos: <strong>${Number(payload[0].value).toLocaleString('es-CL')}</strong>
        </p>
        <p style={{ margin: '0 0 4px 0', color: 'var(--danger)' }}>
          Egresos: <strong>${Number(payload[1].value).toLocaleString('es-CL')}</strong>
        </p>
        <p style={{ margin: '0', borderTop: '1px solid var(--border-color)', paddingTop: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Balance: <strong style={{ color: payload[0].payload.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${payload[0].payload.balance >= 0 ? '+' : ''}{Number(payload[0].payload.balance).toLocaleString('es-CL')}
          </strong>
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ historicalFlowsState }) {
  if (!historicalFlowsState || historicalFlowsState.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        color: 'var(--text-secondary)', 
        textAlign: 'center', 
        gap: '8px', 
        padding: '40px' 
      }}>
        <TrendingUp size={48} color="var(--text-tertiary)" />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>No hay flujos históricos registrados</span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Los gráficos se generarán automáticamente a medida que completes meses.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
      <BarChart
        data={historicalFlowsState}
        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
        barGap={6}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
        <XAxis 
          dataKey="month" 
          stroke="var(--text-secondary)" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="var(--text-secondary)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--accent-rgb), 0.03)' }} />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{value}</span>}
        />
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={25} />
        <Bar dataKey="egresos" name="Egresos" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={25} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DashboardCharts;
