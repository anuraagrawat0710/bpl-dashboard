import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import { useNavigate } from "react-router-dom";

function StaffDashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellingId, setSellingId] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("1");
  const [mySales, setMySales] = useState([]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqModel, setReqModel] = useState("");
  const [reqSerial, setReqSerial] = useState("");
  const [reqPrice, setReqPrice] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [myRequests, setMyRequests] = useState([]);

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

  useEffect(() => {
    fetchMachines();
    fetchMySales();
    fetchMyRequests();
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Staff Dashboard 👷</h1>
      <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
        Logout
      </button>

      <h2>Machines</h2>

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
                No machines available.
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
                  {machine.quantity > 0 && sellingId !== machine.id && (
                    <button onClick={() => setSellingId(machine.id)}>
                      Sell
                    </button>
                  )}

                  {sellingId === machine.id && (
                    <div>
                      <input
                        type="text"
                        placeholder="Buyer name"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Sale price"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Qty to sell"
                        value={sellQuantity}
                        min="1"
                        max={machine.quantity}
                        onChange={(e) => setSellQuantity(e.target.value)}
                        style={{ width: "80px" }}
                      />
                      <button onClick={() => handleSell(machine)}>
                        Confirm
                      </button>
                      <button onClick={() => setSellingId(null)}>Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>Request New Machine</h2>

      <button
        onClick={() => setShowRequestForm(!showRequestForm)}
        style={{ marginBottom: "15px" }}
      >
        {showRequestForm ? "Cancel" : "Request New Machine"}
      </button>

      {showRequestForm && (
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
            value={reqName}
            onChange={(e) => setReqName(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Model"
            value={reqModel}
            onChange={(e) => setReqModel(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Serial number"
            value={reqSerial}
            onChange={(e) => setReqSerial(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="number"
            placeholder="Price"
            value={reqPrice}
            onChange={(e) => setReqPrice(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={reqQuantity}
            onChange={(e) => setReqQuantity(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <button onClick={handleRequestMachine}>Submit Request</button>
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
            <th>Quantity</th>
            <th>Status</th>
            <th>Requested On</th>
          </tr>
        </thead>
        <tbody>
          {myRequests.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                You haven't requested any machines yet.
              </td>
            </tr>
          ) : (
            myRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.model}</td>
                <td>{req.quantity}</td>
                <td>
                  <span
                    style={{
                      color:
                        req.status === "approved"
                          ? "green"
                          : req.status === "rejected"
                            ? "red"
                            : "#b8860b",
                      textTransform: "capitalize",
                    }}
                  >
                    {req.status}
                  </span>
                </td>
                <td>{new Date(req.requested_at).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>My Sales</h2>

      <table
        border="1"
        cellPadding="10"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Machine</th>
            <th>Buyer</th>
            <th>Qty</th>
            <th>Sale Price</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {mySales.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                You haven't sold any machines yet.
              </td>
            </tr>
          ) : (
            mySales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  {sale.machine?.name} ({sale.machine?.model})
                </td>
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

export default StaffDashboard;
