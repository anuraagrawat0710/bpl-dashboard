import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  tokens,
  statAccents,
  chartPalette,
  danger,
  dangerBorder,
} from "../theme/tokens";

const th = {
  textAlign: "left",
  padding: "10px 12px",
  color: tokens.textSecondary,
  fontWeight: 500,
  fontSize: "13px",
  borderBottom: `1px solid ${tokens.border}`,
};
const td = {
  padding: "10px 12px",
  color: tokens.textPrimary,
  fontSize: "14px",
  borderBottom: `1px solid ${tokens.border}`,
};
const cardWrapStyle = {
  background: tokens.cardBg,
  border: `1px solid ${tokens.border}`,
  borderRadius: "10px",
  padding: "18px",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
  marginBottom: "24px",
};
const inputStyle = {
  padding: "7px 10px",
  border: `1px solid ${tokens.border}`,
  borderRadius: "6px",
  fontSize: "13px",
  marginRight: "8px",
};
const primaryBtn = {
  background: statAccents.units,
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "7px 14px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
const secondaryBtn = {
  background: "none",
  border: `1px solid ${tokens.border}`,
  color: tokens.textSecondary,
  borderRadius: "6px",
  padding: "7px 14px",
  fontSize: "13px",
  cursor: "pointer",
  marginLeft: "8px",
};

function StaffDashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellingId, setSellingId] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("1");
  const [mySales, setMySales] = useState([]);

  // Bulk sale — one buyer purchasing multiple different machines at once
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());
  const [showBulkSellForm, setShowBulkSellForm] = useState(false);
  const [bulkBuyerName, setBulkBuyerName] = useState("");
  const [bulkItems, setBulkItems] = useState({}); // { [machineId]: { qty, price } }
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqModel, setReqModel] = useState("");
  const [reqSerial, setReqSerial] = useState("");
  const [reqPrice, setReqPrice] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [myRequests, setMyRequests] = useState([]);

  const [myName, setMyName] = useState("");
  const [myRegion, setMyRegion] = useState("");

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchMachines = async () => {
    const { data, error } = await supabase.from("machine").select("*");
    if (error) {
      console.error(error);
    } else {
      const sorted = [...data].sort((a, b) => b.quantity - a.quantity);
      setMachines(sorted);
    }
    setLoading(false);
  };

  const fetchMySales = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("sales")
      .select("*, machine(name, model)")
      .eq("sold_by", userData.user.id)
      .order("sale_date", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setMySales(data);
    }
  };

  const fetchMyRequests = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("machine_request")
      .select("*")
      .eq("requested_by", userData.user.id)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setMyRequests(data);
    }
  };

  const fetchMyProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profile")
      .select("name, region")
      .eq("id", userData.user.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setMyName(data.name);
      setMyRegion(data.region);
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchMySales();
    fetchMyRequests();
    fetchMyProfile();
  }, []);

  const handleSell = async (machine) => {
    if (!buyerName.trim()) {
      alert("Please enter the buyer's name.");
      return;
    }

    if (!salePrice || Number(salePrice) <= 0) {
      alert("Please enter a valid sale price.");
      return;
    }

    const qtyToSell = Number(sellQuantity);

    if (!qtyToSell || qtyToSell <= 0) {
      alert("Please enter a valid quantity to sell.");
      return;
    }

    if (qtyToSell > machine.quantity) {
      alert(
        `Only ${machine.quantity} units available. You can't sell more than that.`,
      );
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    const { error: saleError } = await supabase.from("sales").insert({
      machine_id: machine.id,
      sold_by: userId,
      buyer_name: buyerName,
      sale_price: salePrice,
      quantity_sold: qtyToSell,
    });

    if (saleError) {
      alert("Error recording sale: " + saleError.message);
      return;
    }

    const newQuantity = machine.quantity - qtyToSell;
    const newStatus = newQuantity <= 0 ? "sold" : "in-stock";

    const { error: updateError } = await supabase
      .from("machine")
      .update({ quantity: newQuantity, status: newStatus })
      .eq("id", machine.id);

    if (updateError) {
      alert("Error updating machine: " + updateError.message);
      return;
    }

    alert("Machine sold successfully!");
    fetchMachines();
    fetchMySales();
    setSellingId(null);
    setBuyerName("");
    setSalePrice("");
    setSellQuantity("1");
  };

  // --- Bulk sale: one buyer purchasing multiple different machines at once ---

  const toggleBulkSelection = (machineId) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(machineId)) {
        next.delete(machineId);
      } else {
        next.add(machineId);
      }
      return next;
    });
  };

  const openBulkSellForm = () => {
    if (bulkSelectedIds.size === 0) {
      alert("Select at least one machine first using the checkboxes.");
      return;
    }
    // Seed qty/price defaults for each selected machine (qty=1, price=listed price)
    const seeded = {};
    machines
      .filter((m) => bulkSelectedIds.has(m.id))
      .forEach((m) => {
        seeded[m.id] = {
          qty: "1",
          price: String(m.price),
        };
      });
    setBulkItems(seeded);
    setShowBulkSellForm(true);
  };

  const updateBulkItemField = (machineId, field, value) => {
    setBulkItems((prev) => ({
      ...prev,
      [machineId]: { ...prev[machineId], [field]: value },
    }));
  };

  const removeBulkItem = (machineId) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(machineId);
      return next;
    });
    setBulkItems((prev) => {
      const next = { ...prev };
      delete next[machineId];
      return next;
    });
  };

  const cancelBulkSell = () => {
    setShowBulkSellForm(false);
    setBulkSelectedIds(new Set());
    setBulkItems({});
    setBulkBuyerName("");
  };

  const handleBulkSellSubmit = async () => {
    if (!bulkBuyerName.trim()) {
      alert("Please enter the buyer's name.");
      return;
    }

    const selectedMachines = machines.filter((m) => bulkSelectedIds.has(m.id));

    if (selectedMachines.length === 0) {
      alert("No machines selected.");
      return;
    }

    // Validate every line item before touching the database
    for (const machine of selectedMachines) {
      const item = bulkItems[machine.id];
      const qty = Number(item?.qty);
      const price = Number(item?.price);

      if (!qty || qty <= 0) {
        alert(`Enter a valid quantity for ${machine.name}.`);
        return;
      }
      if (qty > machine.quantity) {
        alert(`Only ${machine.quantity} units of ${machine.name} available.`);
        return;
      }
      if (!price || price <= 0) {
        alert(`Enter a valid sale price for ${machine.name}.`);
        return;
      }
    }

    setBulkSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    const salesToInsert = selectedMachines.map((machine) => ({
      machine_id: machine.id,
      sold_by: userId,
      buyer_name: bulkBuyerName,
      sale_price: bulkItems[machine.id].price,
      quantity_sold: Number(bulkItems[machine.id].qty),
    }));

    const { error: saleError } = await supabase
      .from("sales")
      .insert(salesToInsert);

    if (saleError) {
      alert("Error recording bulk sale: " + saleError.message);
      setBulkSubmitting(false);
      return;
    }

    // Update stock for every machine sold in this batch
    const updateResults = await Promise.all(
      selectedMachines.map((machine) => {
        const qty = Number(bulkItems[machine.id].qty);
        const newQuantity = machine.quantity - qty;
        const newStatus = newQuantity <= 0 ? "sold" : "in-stock";
        return supabase
          .from("machine")
          .update({ quantity: newQuantity, status: newStatus })
          .eq("id", machine.id);
      }),
    );

    const updateError = updateResults.find((r) => r.error);
    if (updateError) {
      alert(
        "Sale was recorded, but some stock levels may not have updated: " +
          updateError.error.message,
      );
    } else {
      alert(
        `Bulk sale recorded — ${selectedMachines.length} machines sold to ${bulkBuyerName}.`,
      );
    }

    setBulkSubmitting(false);
    cancelBulkSell();
    fetchMachines();
    fetchMySales();
  };

  const handleRequestMachine = async () => {
    if (
      !reqName.trim() ||
      !reqModel.trim() ||
      !reqSerial.trim() ||
      !reqPrice ||
      !reqQuantity
    ) {
      alert("Please fill in all fields before submitting the request.");
      return;
    }

    if (Number(reqPrice) <= 0) {
      alert("Price must be greater than 0.");
      return;
    }

    if (Number(reqQuantity) <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("machine_request").insert({
      name: reqName,
      model: reqModel,
      serial_number: reqSerial,
      price: reqPrice,
      quantity: reqQuantity,
      requested_by: userData.user.id,
      status: "pending",
    });

    if (error) {
      alert("Error submitting request: " + error.message);
      return;
    }

    alert("Request submitted! Waiting for admin approval.");
    setReqName("");
    setReqModel("");
    setReqSerial("");
    setReqPrice("");
    setReqQuantity("");
    setShowRequestForm(false);
    fetchMyRequests();
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading machines...</p>;
  }

  // --- My Performance stats ---
  const myTotalRevenue = mySales.reduce(
    (sum, sale) => sum + Number(sale.sale_price),
    0,
  );
  const myUnitsSold = mySales.reduce(
    (sum, sale) => sum + Number(sale.quantity_sold || 1),
    0,
  );

  const now = new Date();
  const salesThisMonth = mySales.filter((sale) => {
    const d = new Date(sale.sale_date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const revenueThisMonth = salesThisMonth.reduce(
    (sum, sale) => sum + Number(sale.sale_price),
    0,
  );

  // --- My Daily Sales Trend ---
  const dailyMap = {};
  mySales.forEach((sale) => {
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
  const myDailyTrend = Object.values(dailyMap).sort((a, b) =>
    a.key.localeCompare(b.key),
  );

  // --- My Sales by Machine ---
  const machineMap = {};
  mySales.forEach((sale) => {
    const name = sale.machine?.name || "Unknown";
    if (!machineMap[name]) machineMap[name] = 0;
    machineMap[name] += Number(sale.quantity_sold || 1);
  });
  const myMachineBreakdown = Object.entries(machineMap)
    .map(([name, unitsSold]) => ({ name, unitsSold }))
    .sort((a, b) => b.unitsSold - a.unitsSold);

  const statBox = {
    border: `1px solid ${tokens.border}`,
    borderRadius: "10px",
    padding: "14px 18px",
    flex: "1 1 180px",
    background: tokens.cardBg,
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
  };

  const chartCard = {
    border: `1px solid ${tokens.border}`,
    borderRadius: "10px",
    padding: "18px",
    flex: "1 1 380px",
    minWidth: "320px",
    background: tokens.cardBg,
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
  };

  return (
    <div
      style={{
        padding: "20px",
        background: tokens.bg,
        fontFamily: tokens.fontFamily,
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: tokens.textPrimary }}>Staff Dashboard 👷</h1>
      {myName && (
        <p style={{ color: tokens.textSecondary, marginBottom: "5px" }}>
          Welcome, <b style={{ color: tokens.textPrimary }}>{myName}</b>
          {myRegion && ` — ${myRegion}`}
        </p>
      )}
      <button
        onClick={handleLogout}
        style={{
          border: `1px solid ${tokens.border}`,
          background: tokens.cardBg,
          color: tokens.textSecondary,
          borderRadius: "6px",
          padding: "7px 14px",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Logout
      </button>

      <h2 style={{ color: tokens.textPrimary }}>My Performance</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div style={statBox}>
          <p
            style={{ fontSize: "12px", color: tokens.textSecondary, margin: 0 }}
          >
            Total Revenue
          </p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: "4px 0 0",
              color: tokens.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{myTotalRevenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div style={statBox}>
          <p
            style={{ fontSize: "12px", color: tokens.textSecondary, margin: 0 }}
          >
            Machines Sold
          </p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: "4px 0 0",
              color: tokens.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {myUnitsSold}
          </p>
        </div>
        <div style={statBox}>
          <p
            style={{ fontSize: "12px", color: tokens.textSecondary, margin: 0 }}
          >
            Revenue This Month
          </p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: "4px 0 0",
              color: tokens.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{revenueThisMonth.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {mySales.length === 0 ? (
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            background: tokens.cardBg,
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            color: tokens.textSecondary,
            marginBottom: "30px",
          }}
        >
          No sales yet — your charts will appear here once you make your first
          sale.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <div style={chartCard}>
            <h4
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                fontWeight: 600,
                color: tokens.textPrimary,
              }}
            >
              My Daily Sales Trend
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={myDailyTrend}>
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
                  contentStyle={{
                    background: tokens.cardBg,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
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
          </div>

          <div style={chartCard}>
            <h4
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                fontWeight: 600,
                color: tokens.textPrimary,
              }}
            >
              My Sales by Machine
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={myMachineBreakdown} layout="vertical">
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
                  contentStyle={{
                    background: tokens.cardBg,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [`${value} sold`, ""]}
                />
                <Bar dataKey="unitsSold" radius={[0, 4, 4, 0]}>
                  {myMachineBreakdown.map((_, i) => (
                    <Cell
                      key={i}
                      fill={chartPalette[i % chartPalette.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <h2 style={{ color: tokens.textPrimary }}>Machines</h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "13px", color: tokens.textSecondary }}>
          Select machines below to sell multiple items in one transaction.
        </span>
        {bulkSelectedIds.size > 0 && (
          <>
            <button style={primaryBtn} onClick={openBulkSellForm}>
              Bulk Sell ({bulkSelectedIds.size} selected)
            </button>
            <button
              style={secondaryBtn}
              onClick={() => setBulkSelectedIds(new Set())}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {showBulkSellForm && (
        <div
          style={{
            ...cardWrapStyle,
            border: `1.5px solid ${statAccents.units}`,
          }}
        >
          <h4
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
              fontWeight: 600,
              color: tokens.textPrimary,
            }}
          >
            Bulk Sale — {bulkSelectedIds.size} machines
          </h4>

          <input
            type="text"
            placeholder="Buyer name"
            value={bulkBuyerName}
            onChange={(e) => setBulkBuyerName(e.target.value)}
            style={{
              ...inputStyle,
              marginRight: 0,
              marginBottom: "14px",
              width: "260px",
            }}
          />

          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginBottom: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={th}>Machine</th>
                <th style={th}>Available</th>
                <th style={th}>Qty to Sell</th>
                <th style={th}>Sale Price (per unit)</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {machines
                .filter((m) => bulkSelectedIds.has(m.id))
                .map((machine) => (
                  <tr key={machine.id}>
                    <td style={td}>
                      {machine.name} ({machine.model})
                    </td>
                    <td
                      style={{
                        ...td,
                        color: tokens.textSecondary,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {machine.quantity}
                    </td>
                    <td style={td}>
                      <input
                        type="number"
                        min="1"
                        max={machine.quantity}
                        value={bulkItems[machine.id]?.qty || ""}
                        onChange={(e) =>
                          updateBulkItemField(machine.id, "qty", e.target.value)
                        }
                        style={{ ...inputStyle, marginRight: 0, width: "70px" }}
                      />
                    </td>
                    <td style={td}>
                      <input
                        type="number"
                        min="0"
                        value={bulkItems[machine.id]?.price || ""}
                        onChange={(e) =>
                          updateBulkItemField(
                            machine.id,
                            "price",
                            e.target.value,
                          )
                        }
                        style={{
                          ...inputStyle,
                          marginRight: 0,
                          width: "100px",
                        }}
                      />
                    </td>
                    <td style={td}>
                      <button
                        style={{
                          ...secondaryBtn,
                          marginLeft: 0,
                          color: danger,
                          borderColor: dangerBorder,
                        }}
                        onClick={() => removeBulkItem(machine.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {(() => {
            const total = machines
              .filter((m) => bulkSelectedIds.has(m.id))
              .reduce((sum, m) => {
                const qty = Number(bulkItems[m.id]?.qty) || 0;
                const price = Number(bulkItems[m.id]?.price) || 0;
                return sum + qty * price;
              }, 0);
            return (
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: "14px",
                }}
              >
                Total:{" "}
                <span style={{ color: statAccents.revenue }}>
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </p>
            );
          })()}

          <button
            style={primaryBtn}
            onClick={handleBulkSellSubmit}
            disabled={bulkSubmitting}
          >
            {bulkSubmitting ? "Recording sale..." : "Confirm Bulk Sale"}
          </button>
          <button style={secondaryBtn} onClick={cancelBulkSell}>
            Cancel
          </button>
        </div>
      )}

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th style={th}></th>
            <th style={th}>Name</th>
            <th style={th}>Model</th>
            <th style={th}>Serial Number</th>
            <th style={th}>Price</th>
            <th style={th}>Quantity</th>
            <th style={th}>Status</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {machines.length === 0 ? (
            <tr>
              <td
                colSpan="8"
                style={{ ...td, textAlign: "center", padding: "20px" }}
              >
                No machines available.
              </td>
            </tr>
          ) : (
            machines.map((machine) => (
              <tr key={machine.id}>
                <td style={td}>
                  {machine.quantity > 0 && (
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.has(machine.id)}
                      onChange={() => toggleBulkSelection(machine.id)}
                      style={{
                        width: "15px",
                        height: "15px",
                        accentColor: statAccents.units,
                        cursor: "pointer",
                      }}
                    />
                  )}
                </td>
                <td style={td}>{machine.name}</td>
                <td style={td}>{machine.model}</td>
                <td style={td}>{machine.serial_number}</td>
                <td style={td}>
                  ₹{Number(machine.price).toLocaleString("en-IN")}
                </td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                  {machine.quantity}
                </td>
                <td style={td}>
                  <span
                    style={{
                      color:
                        machine.quantity > 0 ? statAccents.revenue : danger,
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {machine.quantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td style={td}>
                  {machine.quantity > 0 && sellingId !== machine.id && (
                    <button
                      style={primaryBtn}
                      onClick={() => setSellingId(machine.id)}
                    >
                      Sell
                    </button>
                  )}

                  {sellingId === machine.id && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Buyer name"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        style={{
                          ...inputStyle,
                          marginRight: 0,
                          width: "120px",
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Sale price"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        style={{
                          ...inputStyle,
                          marginRight: 0,
                          width: "100px",
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Qty to sell"
                        value={sellQuantity}
                        min="1"
                        max={machine.quantity}
                        onChange={(e) => setSellQuantity(e.target.value)}
                        style={{ ...inputStyle, marginRight: 0, width: "70px" }}
                      />
                      <button
                        style={primaryBtn}
                        onClick={() => handleSell(machine)}
                      >
                        Confirm
                      </button>
                      <button
                        style={secondaryBtn}
                        onClick={() => setSellingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ color: tokens.textPrimary, marginTop: "40px" }}>
        Request New Machine
      </h2>

      <button
        style={{ ...primaryBtn, marginBottom: "15px" }}
        onClick={() => setShowRequestForm(!showRequestForm)}
      >
        {showRequestForm ? "Cancel" : "Request New Machine"}
      </button>

      {showRequestForm && (
        <div style={cardWrapStyle}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Machine name"
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="text"
              placeholder="Model"
              value={reqModel}
              onChange={(e) => setReqModel(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="text"
              placeholder="Serial number"
              value={reqSerial}
              onChange={(e) => setReqSerial(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="number"
              placeholder="Price"
              value={reqPrice}
              onChange={(e) => setReqPrice(e.target.value)}
              style={{ ...inputStyle, marginRight: 0, width: "100px" }}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={reqQuantity}
              onChange={(e) => setReqQuantity(e.target.value)}
              style={{ ...inputStyle, marginRight: 0, width: "90px" }}
            />
            <button style={primaryBtn} onClick={handleRequestMachine}>
              Submit Request
            </button>
          </div>
        </div>
      )}

      <div style={{ ...cardWrapStyle, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Model</th>
              <th style={th}>Quantity</th>
              <th style={th}>Status</th>
              <th style={th}>Requested On</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ ...td, textAlign: "center", padding: "20px" }}
                >
                  You haven't requested any machines yet.
                </td>
              </tr>
            ) : (
              myRequests.map((req) => (
                <tr key={req.id}>
                  <td style={td}>{req.name}</td>
                  <td style={td}>{req.model}</td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                    {req.quantity}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        textTransform: "capitalize",
                        color:
                          req.status === "approved"
                            ? statAccents.revenue
                            : req.status === "rejected"
                              ? danger
                              : statAccents.today,
                      }}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td style={{ ...td, color: tokens.textSecondary }}>
                    {new Date(req.requested_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ color: tokens.textPrimary, marginTop: "40px" }}>My Sales</h2>

      <div style={{ ...cardWrapStyle, overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Machine</th>
              <th style={th}>Buyer</th>
              <th style={th}>Qty</th>
              <th style={th}>Sale Price</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {mySales.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ ...td, textAlign: "center", padding: "20px" }}
                >
                  You haven't sold any machines yet.
                </td>
              </tr>
            ) : (
              mySales.map((sale) => (
                <tr key={sale.id}>
                  <td style={td}>
                    {sale.machine?.name} ({sale.machine?.model})
                  </td>
                  <td style={td}>{sale.buyer_name}</td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                    {sale.quantity_sold}
                  </td>
                  <td
                    style={{
                      ...td,
                      color: statAccents.revenue,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹{Number(sale.sale_price).toLocaleString("en-IN")}
                  </td>
                  <td style={{ ...td, color: tokens.textSecondary }}>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StaffDashboard;
