import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";

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
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const fetchAllSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, machine(name, model), profile(name)")
      .order("sale_date", { ascending: false });

    if (error) {
      console.error(error);
    } else {
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

    if (error) {
      console.error(error);
    } else {
      setPendingRequests(data);
    }
  };

  const checkNewSales = (sales) => {
    const lastVisit = localStorage.getItem("adminLastVisit");

    if (lastVisit) {
      const newOnes = sales.filter(
        (sale) => new Date(sale.sale_date) > new Date(lastVisit),
      );
      setNewSalesCount(newOnes.length);
    }

    // Update last visit time to now, for next time
    localStorage.setItem("adminLastVisit", new Date().toISOString());
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

  const handleAddMachine = async () => {
    // Validation
    if (
      !newName.trim() ||
      !newModel.trim() ||
      !newSerial.trim() ||
      !newPrice ||
      !newQuantity
    ) {
      alert("Please fill in all fields before saving.");
      return;
    }

    if (Number(newPrice) <= 0) {
      alert("Price must be greater than 0.");
      return;
    }

    if (Number(newQuantity) <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    await supabase.auth.refreshSession();
    const { data: userData } = await supabase.auth.getUser();

    // Check if a machine with this serial number already exists
    const { data: existing, error: checkError } = await supabase
      .from("machine")
      .select("id, name, quantity")
      .eq("serial_number", newSerial)
      .maybeSingle();

    if (checkError) {
      alert("Error checking existing machines: " + checkError.message);
      return;
    }

    if (existing) {
      alert(
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
      alert("Error adding machine: " + error.message);
      return;
    }

    alert("Machine added successfully!");
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
      alert("Error updating quantity: " + error.message);
      return;
    }

    alert("Quantity updated!");
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
      alert("Error deleting machine: " + error.message);
      return;
    }

    alert("Machine deleted!");
    fetchMachines();
  };

  useEffect(() => {
    fetchMachines();
    fetchAllSales();
    fetchPendingRequests();
  }, []);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading dashboard...</p>;
  }

  const handleApproveRequest = async (request) => {
    await supabase.auth.refreshSession();
    const { data: userData } = await supabase.auth.getUser();

    // Check if a machine with this serial number already exists
    const { data: existing, error: checkError } = await supabase
      .from("machine")
      .select("id, quantity")
      .eq("serial_number", request.serial_number)
      .maybeSingle();

    if (checkError) {
      alert("Error checking existing machines: " + checkError.message);
      return;
    }

    if (existing) {
      // Machine already exists — increase its quantity
      const { error: updateError } = await supabase
        .from("machine")
        .update({
          quantity: existing.quantity + request.quantity,
          status: "in-stock",
        })
        .eq("id", existing.id);

      if (updateError) {
        alert("Error updating machine quantity: " + updateError.message);
        return;
      }
    } else {
      // New machine — insert it
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
        alert("Error adding machine: " + insertError.message);
        return;
      }
    }

    // Mark request as approved
    // Mark request as approved
    const { data: reqData, error: reqError } = await supabase
      .from("machine_request")
      .update({
        status: "approved",
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .select();

    console.log("Request update result:", {
      reqData,
      reqError,
      requestId: request.id,
    });

    if (reqError) {
      alert("Error updating request status: " + reqError.message);
      return;
    }

    if (!reqData || reqData.length === 0) {
      alert("Warning: No request row was updated. Check console for details.");
      return;
    }

    alert("Request approved and inventory updated!");
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
      alert("Error rejecting request: " + error.message);
      return;
    }

    alert("Request rejected.");
    fetchPendingRequests();
  };

  const totalMachineTypes = machines.length;
  const totalUnitsInStock = machines.reduce((sum, m) => sum + m.quantity, 0);
  const outOfStockTypes = machines.filter((m) => m.quantity === 0).length;
  const totalUnitsSold = allSales.reduce(
    (sum, sale) => sum + Number(sale.quantity_sold || 1),
    0,
  );
  const totalRevenue = allSales.reduce(
    (sum, sale) => sum + Number(sale.sale_price),
    0,
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>
        Admin Dashboard 👨‍💼
        {newSalesCount > 0 && (
          <span
            style={{
              backgroundColor: "red",
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
      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>Machine Types</h3>
          <p style={{ fontSize: "24px" }}>{totalMachineTypes}</p>
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>Units In Stock</h3>
          <p style={{ fontSize: "24px" }}>{totalUnitsInStock}</p>
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>Units Sold</h3>
          <p style={{ fontSize: "24px" }}>{totalUnitsSold}</p>
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h3>Total Revenue</h3>
          <p style={{ fontSize: "24px" }}>
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <h2>All Machines</h2>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ marginBottom: "15px" }}
      >
        {showAddForm ? "Cancel" : "Add Machine"}
      </button>

      {showAddForm && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <input
            type="text"
            placeholder="Machine name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Model"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Serial number"
            value={newSerial}
            onChange={(e) => setNewSerial(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="number"
            placeholder="Price"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <button onClick={handleAddMachine}>Save Machine</button>
        </div>
      )}

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Model</th>
            <th>Serial Number</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {machines.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                No machines added yet.
              </td>
            </tr>
          ) : (
            machines.map((machine) => (
              <tr key={machine.id}>
                <td>{machine.name}</td>
                <td>{machine.model}</td>
                <td>{machine.serial_number}</td>
                <td>₹{Number(machine.price).toLocaleString("en-IN")}</td>
                <td>{machine.quantity}</td>
                <td>
                  <span
                    style={{ color: machine.quantity > 0 ? "green" : "red" }}
                  >
                    {machine.quantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td>
                  {editingId === machine.id ? (
                    <div>
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        style={{ width: "60px", marginRight: "5px" }}
                      />
                      <button onClick={() => handleUpdateQuantity(machine.id)}>
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => {
                          setEditingId(machine.id);
                          setEditQuantity(machine.quantity);
                        }}
                      >
                        Edit Qty
                      </button>
                      <button
                        onClick={() => handleDeleteMachine(machine.id)}
                        style={{ marginLeft: "5px" }}
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

      <h2 style={{ marginTop: "40px" }}>Pending Machine Requests</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Model</th>
            <th>Serial Number</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Requested By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingRequests.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                No pending requests.
              </td>
            </tr>
          ) : (
            pendingRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.model}</td>
                <td>{req.serial_number}</td>
                <td>₹{Number(req.price).toLocaleString("en-IN")}</td>
                <td>{req.quantity}</td>
                <td>{req.profile?.name}</td>
                <td>
                  <button onClick={() => handleApproveRequest(req)}>
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    style={{ marginLeft: "5px" }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>All Sales</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Machine</th>
            <th>Sold By</th>
            <th>Buyer</th>
            <th>Qty</th>
            <th>Sale Price</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {allSales.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                No sales recorded yet.
              </td>
            </tr>
          ) : (
            allSales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  {sale.machine?.name} ({sale.machine?.model})
                </td>
                <td>{sale.profile?.name}</td>
                <td>{sale.buyer_name}</td>
                <td>{sale.quantity_sold}</td>
                <td>₹{Number(sale.sale_price).toLocaleString("en-IN")}</td>
                <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
