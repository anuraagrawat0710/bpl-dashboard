import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  tokens,
  regionAccent,
  statAccents,
  chartPalette,
} from "../theme/tokens";

// Shared card wrapper so all charts look consistent
function ChartCard({ title, children, wide }) {
  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "10px",
        padding: "18px",
        flex: wide ? "1 1 100%" : "1 1 380px",
        minWidth: "320px",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
      }}
    >
      <h4
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          fontWeight: 600,
          color: tokens.textPrimary,
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

// Custom tooltip so numbers show in ₹/Indian formatting instead of recharts' default
function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "13px",
        boxShadow: "0 2px 6px rgba(16,24,40,0.08)",
      }}
    >
      <div style={{ color: tokens.textSecondary, marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ color: tokens.textPrimary, fontWeight: 600 }}>
        ₹{Number(payload[0].value).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function CountTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "13px",
        boxShadow: "0 2px 6px rgba(16,24,40,0.08)",
      }}
    >
      <div style={{ color: tokens.textSecondary, marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ color: tokens.textPrimary, fontWeight: 600 }}>
        {payload[0].value} sold
      </div>
    </div>
  );
}

// Multi-line tooltip — lists every machine's revenue for that day, only non-zero entries
function MultiCurrencyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const nonZero = payload.filter((p) => p.value > 0);
  if (!nonZero.length) return null;
  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "13px",
        boxShadow: "0 2px 6px rgba(16,24,40,0.08)",
      }}
    >
      <div style={{ color: tokens.textSecondary, marginBottom: "4px" }}>
        {label}
      </div>
      {nonZero.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: tokens.textPrimary,
            fontWeight: 600,
            marginTop: "2px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          {entry.dataKey}: ₹{Number(entry.value).toLocaleString("en-IN")}
        </div>
      ))}
    </div>
  );
}

/**
 * ChartsSection — Step 3
 * Props:
 *   allSales: array of sale rows (must include sale_price, sale_date,
 *             quantity_sold, sold_by, and joined machine(name, model))
 *   allStaff: array of staff profiles (must include id, region)
 *   regions: array of region name strings, e.g. ["Delhi","Mumbai",...]
 */
function ChartsSection({ allSales, allStaff, regions }) {
  // --- Revenue by Region ---
  const revenueByRegion = regions.map((region) => {
    const staffIds = allStaff
      .filter((s) => s.region === region)
      .map((s) => s.id);
    const revenue = allSales
      .filter((sale) => staffIds.includes(sale.sold_by))
      .reduce((sum, sale) => sum + Number(sale.sale_price), 0);
    return { region, revenue };
  });

  // --- Daily Sales trend (revenue per calendar day, chronological) ---
  const dailyMap = {};
  allSales.forEach((sale) => {
    const d = new Date(sale.sale_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dailyMap[key]) {
      dailyMap[key] = {
        key,
        label: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        revenue: 0,
      };
    }
    dailyMap[key].revenue += Number(sale.sale_price);
  });
  const dailySales = Object.values(dailyMap).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  // --- Top Selling Machines (by units sold, top 5) ---
  const machineMap = {};
  allSales.forEach((sale) => {
    const name = sale.machine?.name || "Unknown";
    if (!machineMap[name]) machineMap[name] = 0;
    machineMap[name] += Number(sale.quantity_sold || 1);
  });
  const topMachines = Object.entries(machineMap)
    .map(([name, unitsSold]) => ({ name, unitsSold }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // --- Sales Trend by Machine Type (daily revenue, same top 5 machines) ---
  const topMachineNames = topMachines.map((m) => m.name);

  const trendMap = {};
  allSales.forEach((sale) => {
    const name = sale.machine?.name || "Unknown";
    if (!topMachineNames.includes(name)) return;

    const d = new Date(sale.sale_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (!trendMap[key]) {
      trendMap[key] = {
        key,
        label: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      };
      topMachineNames.forEach((n) => {
        trendMap[key][n] = 0;
      });
    }
    trendMap[key][name] += Number(sale.sale_price);
  });
  const machineTrend = Object.values(trendMap).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  const hasSales = allSales.length > 0;

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{ color: tokens.textPrimary }}>Sales Analytics</h2>

      {!hasSales ? (
        <div
          style={{
            background: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: "10px",
            padding: "30px",
            textAlign: "center",
            color: tokens.textSecondary,
          }}
        >
          No sales recorded yet — charts will appear here once sales start
          coming in.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <ChartCard title="Revenue by Region">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByRegion}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={tokens.border}
                  vertical={false}
                />
                <XAxis
                  dataKey="region"
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={{ stroke: tokens.border }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<CurrencyTooltip />}
                  cursor={{ fill: `${regionAccent}0d` }}
                />
                <Bar
                  dataKey="revenue"
                  fill={regionAccent}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Sales Trend">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailySales}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={tokens.border}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={{ stroke: tokens.border }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<CurrencyTooltip />}
                  cursor={{ stroke: tokens.border }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={statAccents.revenue}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: statAccents.revenue }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top Selling Machines">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topMachines} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={tokens.border}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={{ stroke: tokens.border }}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  content={<CountTooltip />}
                  cursor={{ fill: "rgba(16,24,40,0.03)" }}
                />
                <Bar dataKey="unitsSold" radius={[0, 4, 4, 0]}>
                  {topMachines.map((_, i) => (
                    <Cell
                      key={i}
                      fill={chartPalette[i % chartPalette.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sales Trend by Machine Type" wide>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={machineTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={tokens.border}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={{ stroke: tokens.border }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tokens.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<MultiCurrencyTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    color: tokens.textSecondary,
                  }}
                />
                {topMachineNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={chartPalette[i % chartPalette.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

export default ChartsSection;
