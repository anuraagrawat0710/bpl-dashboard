import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import {
  tokens,
  statAccents,
  regionAccent,
  danger,
  dangerBg,
  dangerBorder,
} from "../theme/tokens";
import ChartsSection from "../components/ChartsSection";
import "../print.css";

// Small inline icon set (no external icon library dependency)
const Icon = {
  Revenue: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <text
        x="12"
        y="17.5"
        fontSize="17"
        fontWeight="700"
        textAnchor="middle"
        fill={color}
        fontFamily="'Inter', Arial, sans-serif"
      >
        ₹
      </text>
    </svg>
  ),
  Machines: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3 7.5v9L12 21l9-4.5v-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M12 12v9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Today: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Staff: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
      <path
        d="M3.5 19c.7-3 3-4.8 5.5-4.8s4.8 1.8 5.5 4.8M15 8.2a3 3 0 1 1 3.6 4.9M18.5 14.3c2 .6 3.4 2.2 4 4.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Pin: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.3" stroke={color} strokeWidth="1.8" />
    </svg>
  ),
  Download: (color) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12m0 0-4-4m4 4 4-4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Printer: (color) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9V3h12v6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="9"
        width="16"
        height="8"
        rx="1.5"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M6 14h12v7H6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

function StatCard({ label, value, accent, icon }) {
  return (
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderLeft: `4px solid ${accent}`,
        borderRadius: "10px",
        padding: "16px 18px",
        flex: "1 1 200px",
        minWidth: "200px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: tokens.textSecondary,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: `${accent}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon(accent)}
        </div>
      </div>
      <span
        style={{
          fontSize: "26px",
          fontWeight: 700,
          color: tokens.textPrimary,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function RegionCard({ region, stats, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.cardBg,
        border: isSelected
          ? `1.5px solid ${regionAccent}`
          : `1px solid ${tokens.border}`,
        borderTop: `4px solid ${regionAccent}`,
        borderRadius: "10px",
        padding: "16px 18px",
        cursor: "pointer",
        flex: "1 1 200px",
        minWidth: "200px",
        boxShadow: isSelected
          ? "0 2px 6px rgba(29, 78, 137, 0.14)"
          : "0 1px 2px rgba(16, 24, 40, 0.04)",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: tokens.textPrimary,
          }}
        >
          {region}
        </h3>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            background: `${regionAccent}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon.Pin(regionAccent)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: tokens.textSecondary }}>Staff</span>
          <span
            style={{
              color: tokens.textPrimary,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stats.staffCount}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: tokens.textSecondary }}>Sales</span>
          <span
            style={{
              color: tokens.textPrimary,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stats.salesCount}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            paddingTop: "6px",
            marginTop: "2px",
            borderTop: `1px solid ${tokens.border}`,
          }}
        >
          <span style={{ color: tokens.textSecondary }}>Revenue</span>
          <span
            style={{
              color: regionAccent,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{stats.revenue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allSales, setAllSales] = useState([]);
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [newSalesCount, setNewSalesCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [myName, setMyName] = useState("");

  const [machineSearch, setMachineSearch] = useState("");
  const [machineStockFilter, setMachineStockFilter] = useState("all");

  const [salesSearch, setSalesSearch] = useState("");
  const [salesRegionFilter, setSalesRegionFilter] = useState("all");
  const [salesStaffFilter, setSalesStaffFilter] = useState("all");
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");

  // Bulk actions — Machines
  const [selectedMachineIds, setSelectedMachineIds] = useState(new Set());

  const toggleMachineSelection = (id) => {
    setSelectedMachineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchAllSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, machine(name, model), profile(name, region)")
      .order("sale_date", { ascending: false });
    if (error) console.error(error);
    else {
      setAllSales(data);
      checkNewSales(data);
    }
  };

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from("machine_request")
      .select("*, profile!requested_by(name)")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    if (error) console.error(error);
    else setPendingRequests(data);
  };

  const fetchAllStaff = async () => {
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("role", "staff");
    if (error) console.error(error);
    else setAllStaff(data);
  };

  const fetchMyProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profile")
      .select("name")
      .eq("id", userData.user.id)
      .single();
    if (error) console.error(error);
    else setMyName(data.name);
  };

  const checkNewSales = (sales) => {
    const lastVisit = localStorage.getItem("adminLastVisit");
    if (lastVisit) {
      const newOnes = sales.filter(
        (sale) => new Date(sale.sale_date) > new Date(lastVisit),
      );
      setNewSalesCount(newOnes.length);
    }
    localStorage.setItem("adminLastVisit", new Date().toISOString());
  };

  const fetchMachines = async () => {
    const { data, error } = await supabase.from("machine").select("*");
    if (error) console.error(error);
    else {
      const sorted = [...data].sort((a, b) => b.quantity - a.quantity);
      setMachines(sorted);
    }
    setLoading(false);
  };

  const handleAddMachine = async () => {
    if (
      !newName.trim() ||
      !newModel.trim() ||
      !newSerial.trim() ||
      !newPrice ||
      !newQuantity
    ) {
      toast.error("Please fill in all fields before saving.");
      return;
    }
    if (Number(newPrice) <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }
    if (Number(newQuantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    await supabase.auth.refreshSession();
    const { data: userData } = await supabase.auth.getUser();

    const { data: existing, error: checkError } = await supabase
      .from("machine")
      .select("id, name, quantity")
      .eq("serial_number", newSerial)
      .maybeSingle();

    if (checkError) {
      toast.error("Error checking existing machines: " + checkError.message);
      return;
    }
    if (existing) {
      toast.error(
        `A machine with this serial number already exists ("${existing.name}", current quantity: ${existing.quantity}). Please use "Edit Qty" on that row instead of adding a duplicate.`,
      );
      return;
    }

    const { error } = await supabase.from("machine").insert({
      name: newName,
      model: newModel,
      serial_number: newSerial,
      price: newPrice,
      quantity: newQuantity,
      status: "in-stock",
      added_by: userData.user.id,
    });

    if (error) {
      toast.error("Error adding machine: " + error.message);
      return;
    }

    toast.success("Machine added successfully!");
    setNewName("");
    setNewModel("");
    setNewSerial("");
    setNewPrice("");
    setNewQuantity("");
    setShowAddForm(false);
    fetchMachines();
  };

  const handleUpdateQuantity = async (machineId) => {
    const newQty = parseInt(editQuantity);
    const newStatus = newQty <= 0 ? "sold" : "in-stock";
    const { error } = await supabase
      .from("machine")
      .update({ quantity: newQty, status: newStatus })
      .eq("id", machineId);
    if (error) {
      toast.error("Error updating quantity: " + error.message);
      return;
    }
    toast.success("Quantity updated!");
    setEditingId(null);
    setEditQuantity("");
    fetchMachines();
  };

  const handleDeleteMachine = async (machineId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this machine?",
    );
    if (!confirmed) return;
    const { error } = await supabase
      .from("machine")
      .delete()
      .eq("id", machineId);
    if (error) {
      if (error.code === "23503") {
        toast.error(
          "Can't delete this machine — it has sales history tied to it.",
        );
      } else {
        toast.error("Error deleting machine: " + error.message);
      }
      return;
    }
    toast.success("Machine deleted!");
    fetchMachines();
  };

  useEffect(() => {
    fetchMachines();
    fetchAllSales();
    fetchPendingRequests();
    fetchAllStaff();
    fetchMyProfile();
  }, []);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading dashboard...</p>;
  }

  const handleApproveRequest = async (request) => {
    await supabase.auth.refreshSession();
    const { data: userData } = await supabase.auth.getUser();

    const { data: existing, error: checkError } = await supabase
      .from("machine")
      .select("id, quantity")
      .eq("serial_number", request.serial_number)
      .maybeSingle();

    if (checkError) {
      toast.error("Error checking existing machines: " + checkError.message);
      return;
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("machine")
        .update({
          quantity: existing.quantity + request.quantity,
          status: "in-stock",
        })
        .eq("id", existing.id);
      if (updateError) {
        toast.error("Error updating machine quantity: " + updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("machine").insert({
        name: request.name,
        model: request.model,
        serial_number: request.serial_number,
        price: request.price,
        quantity: request.quantity,
        status: "in-stock",
        added_by: request.requested_by,
      });
      if (insertError) {
        toast.error("Error adding machine: " + insertError.message);
        return;
      }
    }

    const { data: reqData, error: reqError } = await supabase
      .from("machine_request")
      .update({
        status: "approved",
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .select();

    if (reqError) {
      toast.error("Error updating request status: " + reqError.message);
      return;
    }
    if (!reqData || reqData.length === 0) {
      toast.error(
        "Warning: No request row was updated. Check console for details.",
      );
      return;
    }

    toast.success("Request approved and inventory updated!");
    fetchMachines();
    fetchPendingRequests();
  };

  const handleRejectRequest = async (requestId) => {
    await supabase.auth.refreshSession();
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("machine_request")
      .update({
        status: "rejected",
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      toast.error("Error rejecting request: " + error.message);
      return;
    }
    toast.success("Request rejected.");
    fetchPendingRequests();
  };

  const totalMachineTypes = machines.length;
  const totalUnitsInStock = machines.reduce((sum, m) => sum + m.quantity, 0);
  const totalUnitsSold = allSales.reduce(
    (sum, sale) => sum + Number(sale.quantity_sold || 1),
    0,
  );
  const totalRevenue = allSales.reduce(
    (sum, sale) => sum + Number(sale.sale_price),
    0,
  );

  const todayStr = new Date().toDateString();
  const salesToday = allSales.filter(
    (sale) => new Date(sale.sale_date).toDateString() === todayStr,
  );
  const revenueToday = salesToday.reduce(
    (sum, sale) => sum + Number(sale.sale_price),
    0,
  );

  const regions = ["Delhi", "Mumbai", "Bangalore", "Chennai"];

  const getRegionStats = (region) => {
    const staffInRegion = allStaff.filter((s) => s.region === region);
    const staffIds = staffInRegion.map((s) => s.id);
    const salesInRegion = allSales.filter((sale) =>
      staffIds.includes(sale.sold_by),
    );
    const revenue = salesInRegion.reduce(
      (sum, sale) => sum + Number(sale.sale_price),
      0,
    );
    return {
      staffCount: staffInRegion.length,
      salesCount: salesInRegion.length,
      revenue,
      staff: staffInRegion,
      sales: salesInRegion,
    };
  };

  // Per-staff totals — total sales generated (all time) and this calendar month
  const now = new Date();
  const getStaffStats = (staffId) => {
    const staffSales = allSales.filter((sale) => sale.sold_by === staffId);
    const totalRevenue = staffSales.reduce(
      (sum, sale) => sum + Number(sale.sale_price),
      0,
    );
    const monthRevenue = staffSales
      .filter((sale) => {
        const d = new Date(sale.sale_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, sale) => sum + Number(sale.sale_price), 0);

    return {
      salesCount: staffSales.length,
      totalRevenue,
      monthRevenue,
    };
  };

  const filteredMachines = machines.filter((m) => {
    const q = machineSearch.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q);
    const matchesStock =
      machineStockFilter === "all" ||
      (machineStockFilter === "in-stock" && m.quantity > 0) ||
      (machineStockFilter === "out-of-stock" && m.quantity <= 0);
    return matchesSearch && matchesStock;
  });

  // Bulk actions — depend on filteredMachines, so declared right after it
  const toggleSelectAllMachines = () => {
    if (
      selectedMachineIds.size === filteredMachines.length &&
      filteredMachines.length > 0
    ) {
      setSelectedMachineIds(new Set());
    } else {
      setSelectedMachineIds(new Set(filteredMachines.map((m) => m.id)));
    }
  };

  const handleBulkDeleteMachines = async () => {
    if (selectedMachineIds.size === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedMachineIds.size} machine${selectedMachineIds.size > 1 ? "s" : ""}? This cannot be undone.`,
    );
    if (!confirmed) return;

    const idsToDelete = Array.from(selectedMachineIds);
    let deletedCount = 0;
    let blockedCount = 0;

    for (const id of idsToDelete) {
      const { error } = await supabase.from("machine").delete().eq("id", id);
      if (error) {
        blockedCount++;
      } else {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      toast.success(
        `${deletedCount} machine${deletedCount > 1 ? "s" : ""} deleted!`,
      );
    }
    if (blockedCount > 0) {
      toast.error(
        `${blockedCount} machine${blockedCount > 1 ? "s" : ""} couldn't be deleted — they have sales history.`,
      );
    }

    setSelectedMachineIds(new Set());
    fetchMachines();
  };

  const filteredSales = allSales.filter((sale) => {
    const search = salesSearch.toLowerCase();
    const buyer = sale.buyer_name?.toLowerCase() || "";
    const machine = sale.machine?.name?.toLowerCase() || "";
    const region = sale.profile?.region || "";
    const staffId = sale.sold_by;

    const matchesSearch =
      !search || buyer.includes(search) || machine.includes(search);
    const matchesRegion =
      salesRegionFilter === "all" || region === salesRegionFilter;
    const matchesStaff =
      salesStaffFilter === "all" ||
      String(staffId) === String(salesStaffFilter);

    const saleDate = new Date(sale.sale_date);
    const matchesFrom = !salesDateFrom || saleDate >= new Date(salesDateFrom);
    const matchesTo =
      !salesDateTo || saleDate <= new Date(salesDateTo + "T23:59:59");

    return (
      matchesSearch && matchesRegion && matchesStaff && matchesFrom && matchesTo
    );
  });

  const exportToExcel = () => {
    const exportData = filteredSales.map((sale) => ({
      Machine: sale.machine?.name || "",
      Model: sale.machine?.model || "",
      Buyer: sale.buyer_name || "",
      "Sold By": sale.profile?.name || "",
      Region: sale.profile?.region || "",
      Quantity: sale.quantity_sold,
      "Sale Price": sale.sale_price,
      Date: new Date(sale.sale_date).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(data, `Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("BPL Technologies", 14, 18);

    doc.setFontSize(12);
    doc.text("Sales Report", 14, 28);

    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);
    doc.text(`Total Sales: ${filteredSales.length}`, 14, 46);

    const revenue = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.sale_price),
      0,
    );
    doc.text(`Total Revenue: Rs. ${revenue.toLocaleString("en-IN")}`, 14, 54);

    autoTable(doc, {
      startY: 64,
      head: [["Machine", "Buyer", "Staff", "Region", "Qty", "Price", "Date"]],
      body: filteredSales.map((sale) => [
        sale.machine?.name || "",
        sale.buyer_name || "",
        sale.profile?.name || "",
        sale.profile?.region || "",
        sale.quantity_sold,
        `Rs. ${Number(sale.sale_price).toLocaleString("en-IN")}`,
        new Date(sale.sale_date).toLocaleDateString(),
      ]),
    });

    doc.save(`Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const printReport = () => {
    window.print();
  };

  const filterInput = {
    padding: "7px 10px",
    border: `1px solid ${tokens.border}`,
    borderRadius: "6px",
    fontSize: "13px",
    background: tokens.cardBg,
    color: tokens.textPrimary,
    outline: "none",
  };

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
    overflowX: "auto",
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

  return (
    <div
      style={{
        padding: "20px",
        background: tokens.bg,
        fontFamily: tokens.fontFamily,
        minHeight: "100vh",
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: tokens.cardBg,
            color: tokens.textPrimary,
            border: `1px solid ${tokens.border}`,
            borderRadius: "8px",
            fontFamily: tokens.fontFamily,
            fontSize: "13px",
            boxShadow: "0 2px 8px rgba(16, 24, 40, 0.08)",
          },
          success: {
            iconTheme: { primary: statAccents.revenue, secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: danger, secondary: "#fff" },
          },
        }}
      />
      <h1 style={{ color: tokens.textPrimary }}>
        Admin Dashboard 👨‍💼
        {newSalesCount > 0 && (
          <span
            style={{
              backgroundColor: danger,
              color: "white",
              borderRadius: "12px",
              padding: "2px 10px",
              fontSize: "14px",
              marginLeft: "10px",
            }}
          >
            {newSalesCount} new sale{newSalesCount > 1 ? "s" : ""}
          </span>
        )}
      </h1>
      {myName && (
        <p style={{ color: tokens.textSecondary, marginBottom: "5px" }}>
          Logged in as: <b style={{ color: tokens.textPrimary }}>{myName}</b>
        </p>
      )}
      <button
        onClick={handleLogout}
        style={{ ...secondaryBtn, marginLeft: 0, marginBottom: "20px" }}
      >
        Logout
      </button>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          accent={statAccents.revenue}
          icon={Icon.Revenue}
        />
        <StatCard
          label="Machines Sold"
          value={totalUnitsSold}
          accent={statAccents.units}
          icon={Icon.Machines}
        />
        <StatCard
          label="Revenue Today"
          value={`₹${revenueToday.toLocaleString("en-IN")}`}
          accent={statAccents.today}
          icon={Icon.Today}
        />
        <StatCard
          label="Total Staff"
          value={allStaff.length}
          accent={statAccents.staff}
          icon={Icon.Staff}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            background: tokens.cardBg,
            padding: "12px 16px",
            borderRadius: "8px",
            flex: "1 1 160px",
          }}
        >
          <p
            style={{ fontSize: "12px", color: tokens.textSecondary, margin: 0 }}
          >
            Machine Types
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              margin: "4px 0 0",
              color: tokens.textPrimary,
            }}
          >
            {totalMachineTypes}
          </p>
        </div>
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            background: tokens.cardBg,
            padding: "12px 16px",
            borderRadius: "8px",
            flex: "1 1 160px",
          }}
        >
          <p
            style={{ fontSize: "12px", color: tokens.textSecondary, margin: 0 }}
          >
            Units In Stock
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              margin: "4px 0 0",
              color: tokens.textPrimary,
            }}
          >
            {totalUnitsInStock}
          </p>
        </div>
      </div>

      <h2 style={{ color: tokens.textPrimary }}>Regions</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {regions.map((region) => {
          const stats = getRegionStats(region);
          return (
            <RegionCard
              key={region}
              region={region}
              stats={stats}
              isSelected={selectedRegion === region}
              onClick={() =>
                setSelectedRegion(selectedRegion === region ? null : region)
              }
            />
          );
        })}
      </div>

      {selectedRegion && (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            background: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            borderTop: `4px solid ${regionAccent}`,
            borderRadius: "10px",
            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{ margin: 0, color: tokens.textPrimary, fontSize: "17px" }}
            >
              {selectedRegion} — Details
            </h3>
            <button
              onClick={() => setSelectedRegion(null)}
              style={{
                border: `1px solid ${tokens.border}`,
                background: tokens.cardBg,
                color: tokens.textSecondary,
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          <h4
            style={{
              color: tokens.textSecondary,
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              marginBottom: "8px",
            }}
          >
            Staff in {selectedRegion}
          </h4>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: tokens.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: tokens.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Sales
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: tokens.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Total Revenue
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    color: tokens.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  This Month
                </th>
              </tr>
            </thead>
            <tbody>
              {getRegionStats(selectedRegion).staff.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: tokens.textSecondary,
                    }}
                  >
                    No staff in this region.
                  </td>
                </tr>
              ) : (
                getRegionStats(selectedRegion).staff.map((s) => {
                  const stats = getStaffStats(s.id);
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: `1px solid ${tokens.border}` }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                        }}
                      >
                        {s.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {stats.salesCount}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: statAccents.revenue,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₹{stats.totalRevenue.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textSecondary,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₹{stats.monthRevenue.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <h4
            style={{
              color: tokens.textSecondary,
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              marginBottom: "8px",
            }}
          >
            Recent Sales in {selectedRegion}
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Machine
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Sold By
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Buyer
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Sale Price
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      color: tokens.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {getRegionStats(selectedRegion).sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "16px",
                        color: tokens.textSecondary,
                      }}
                    >
                      No sales in this region yet.
                    </td>
                  </tr>
                ) : (
                  getRegionStats(selectedRegion).sales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{ borderBottom: `1px solid ${tokens.border}` }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                        }}
                      >
                        {sale.machine?.name} ({sale.machine?.model})
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                        }}
                      >
                        {sale.profile?.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                        }}
                      >
                        {sale.buyer_name}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textPrimary,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {sale.quantity_sold}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: regionAccent,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₹{Number(sale.sale_price).toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: tokens.textSecondary,
                        }}
                      >
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChartsSection
        allSales={allSales}
        allStaff={allStaff}
        regions={regions}
      />

      <h2 style={{ color: tokens.textPrimary }}>All Machines</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
          marginBottom: "14px",
          padding: "12px 14px",
          background: tokens.cardBg,
          border: `1px solid ${tokens.border}`,
          borderRadius: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Search name or model…"
          value={machineSearch}
          onChange={(e) => setMachineSearch(e.target.value)}
          style={{ ...filterInput, flex: "1 1 200px", minWidth: "160px" }}
        />
        <select
          value={machineStockFilter}
          onChange={(e) => setMachineStockFilter(e.target.value)}
          style={{ ...filterInput, minWidth: "130px" }}
        >
          <option value="all">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        {(machineSearch || machineStockFilter !== "all") && (
          <button
            onClick={() => {
              setMachineSearch("");
              setMachineStockFilter("all");
            }}
            style={{
              ...filterInput,
              cursor: "pointer",
              color: tokens.textSecondary,
              border: `1px solid ${tokens.border}`,
              background: tokens.bg,
            }}
          >
            Clear
          </button>
        )}
        <span
          style={{
            fontSize: "12px",
            color: tokens.textSecondary,
            marginLeft: "auto",
          }}
        >
          {filteredMachines.length} of {machines.length}
        </span>
      </div>

      {/* Bulk action bar — only shows when machines are selected */}
      {selectedMachineIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
            padding: "10px 14px",
            background: dangerBg,
            border: `1px solid ${dangerBorder}`,
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "13px", color: danger, fontWeight: 600 }}>
            {selectedMachineIds.size} selected
          </span>
          <button
            onClick={handleBulkDeleteMachines}
            style={{
              border: "none",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              background: danger,
              color: "#fff",
              boxShadow: "0 1px 2px rgba(178, 59, 78, 0.24)",
            }}
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedMachineIds(new Set())}
            style={{
              border: `1px solid ${dangerBorder}`,
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "13px",
              cursor: "pointer",
              color: danger,
              background: tokens.cardBg,
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ ...primaryBtn, marginBottom: "15px" }}
      >
        {showAddForm ? "Cancel" : "Add Machine"}
      </button>

      {showAddForm && (
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
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="text"
              placeholder="Model"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="text"
              placeholder="Serial number"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              style={{ ...inputStyle, marginRight: 0 }}
            />
            <input
              type="number"
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              style={{ ...inputStyle, marginRight: 0, width: "100px" }}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              style={{ ...inputStyle, marginRight: 0, width: "90px" }}
            />
            <button style={primaryBtn} onClick={handleAddMachine}>
              Save Machine
            </button>
          </div>
        </div>
      )}

      <div style={cardWrapStyle}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>
                <input
                  type="checkbox"
                  checked={
                    selectedMachineIds.size === filteredMachines.length &&
                    filteredMachines.length > 0
                  }
                  onChange={toggleSelectAllMachines}
                  style={{
                    width: "15px",
                    height: "15px",
                    accentColor: statAccents.units,
                    cursor: "pointer",
                  }}
                />
              </th>
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
            {filteredMachines.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ ...td, textAlign: "center", padding: "20px" }}
                >
                  {machines.length === 0
                    ? "No machines added yet."
                    : "No machines match your filters."}
                </td>
              </tr>
            ) : (
              filteredMachines.map((machine) => (
                <tr key={machine.id}>
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={selectedMachineIds.has(machine.id)}
                      onChange={() => toggleMachineSelection(machine.id)}
                      style={{
                        width: "15px",
                        height: "15px",
                        accentColor: statAccents.units,
                        cursor: "pointer",
                      }}
                    />
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
                    {editingId === machine.id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          style={{
                            ...inputStyle,
                            marginRight: 0,
                            width: "60px",
                          }}
                        />
                        <button
                          style={primaryBtn}
                          onClick={() => handleUpdateQuantity(machine.id)}
                        >
                          Save
                        </button>
                        <button
                          style={secondaryBtn}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <button
                          style={secondaryBtn}
                          onClick={() => {
                            setEditingId(machine.id);
                            setEditQuantity(machine.quantity);
                          }}
                        >
                          Edit Qty
                        </button>
                        <button
                          style={{
                            ...secondaryBtn,
                            color: danger,
                            borderColor: dangerBorder,
                          }}
                          onClick={() => handleDeleteMachine(machine.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ color: tokens.textPrimary, marginTop: "40px" }}>
        Pending Machine Requests
      </h2>

      <div style={cardWrapStyle}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Model</th>
              <th style={th}>Serial Number</th>
              <th style={th}>Price</th>
              <th style={th}>Quantity</th>
              <th style={th}>Requested By</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ ...td, textAlign: "center", padding: "20px" }}
                >
                  No pending requests.
                </td>
              </tr>
            ) : (
              pendingRequests.map((req) => (
                <tr key={req.id}>
                  <td style={td}>{req.name}</td>
                  <td style={td}>{req.model}</td>
                  <td style={td}>{req.serial_number}</td>
                  <td style={td}>
                    ₹{Number(req.price).toLocaleString("en-IN")}
                  </td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>
                    {req.quantity}
                  </td>
                  <td style={td}>{req.profile?.name}</td>
                  <td style={td}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        style={primaryBtn}
                        onClick={() => handleApproveRequest(req)}
                      >
                        Approve
                      </button>
                      <button
                        style={{
                          ...secondaryBtn,
                          color: danger,
                          borderColor: dangerBorder,
                        }}
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div id="printable-sales-report">
        <h2 style={{ color: tokens.textPrimary, marginTop: "40px" }}>
          All Sales
        </h2>

        <div
          style={{
            display: "inline-flex",
            gap: "2px",
            marginBottom: "15px",
            background: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: "8px",
            padding: "3px",
          }}
        >
          <button
            onClick={exportToExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "none",
              borderRadius: "6px",
              padding: "7px 13px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: tokens.textPrimary,
            }}
          >
            {Icon.Download(statAccents.revenue)}
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "none",
              borderRadius: "6px",
              padding: "7px 13px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: tokens.textPrimary,
            }}
          >
            {Icon.Download(statAccents.units)}
            Export PDF
          </button>
          <button
            onClick={printReport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "none",
              borderRadius: "6px",
              padding: "7px 13px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: tokens.textPrimary,
            }}
          >
            {Icon.Printer(tokens.textSecondary)}
            Print
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            marginBottom: "14px",
            padding: "12px 14px",
            background: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: "8px",
          }}
        >
          <input
            type="text"
            placeholder="Search buyer or machine…"
            value={salesSearch}
            onChange={(e) => setSalesSearch(e.target.value)}
            style={{ ...filterInput, flex: "1 1 180px", minWidth: "150px" }}
          />
          <select
            value={salesRegionFilter}
            onChange={(e) => setSalesRegionFilter(e.target.value)}
            style={{ ...filterInput, minWidth: "120px" }}
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={salesStaffFilter}
            onChange={(e) => setSalesStaffFilter(e.target.value)}
            style={{ ...filterInput, minWidth: "130px" }}
          >
            <option value="all">All Staff</option>
            {allStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: tokens.textSecondary,
            }}
          >
            From
            <input
              type="date"
              value={salesDateFrom}
              onChange={(e) => setSalesDateFrom(e.target.value)}
              style={{ ...filterInput, width: "130px" }}
            />
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: tokens.textSecondary,
            }}
          >
            To
            <input
              type="date"
              value={salesDateTo}
              onChange={(e) => setSalesDateTo(e.target.value)}
              style={{ ...filterInput, width: "130px" }}
            />
          </label>
          {(salesSearch ||
            salesRegionFilter !== "all" ||
            salesStaffFilter !== "all" ||
            salesDateFrom ||
            salesDateTo) && (
            <button
              onClick={() => {
                setSalesSearch("");
                setSalesRegionFilter("all");
                setSalesStaffFilter("all");
                setSalesDateFrom("");
                setSalesDateTo("");
              }}
              style={{
                ...filterInput,
                cursor: "pointer",
                color: tokens.textSecondary,
                border: `1px solid ${tokens.border}`,
                background: tokens.bg,
              }}
            >
              Clear
            </button>
          )}
          <span
            style={{
              fontSize: "12px",
              color: tokens.textSecondary,
              marginLeft: "auto",
            }}
          >
            {filteredSales.length} of {allSales.length}
          </span>
        </div>

        <div style={cardWrapStyle}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Machine</th>
                <th style={th}>Sold By</th>
                <th style={th}>Buyer</th>
                <th style={th}>Qty</th>
                <th style={th}>Sale Price</th>
                <th style={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{ ...td, textAlign: "center", padding: "20px" }}
                  >
                    {allSales.length === 0
                      ? "No sales recorded yet."
                      : "No sales match your filters."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td style={td}>
                      {sale.machine?.name} ({sale.machine?.model})
                    </td>
                    <td style={td}>{sale.profile?.name}</td>
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
    </div>
  );
}

export default AdminDashboard;
