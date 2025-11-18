import React, { useEffect, useState } from "react";
import {
  getUserMetadata,
  subscribeToProperties,
} from "../services/firestoreService";
import toast from "react-hot-toast";

import { useAuth } from "../app/providers/AuthProvider";

//CSS
import "@/styles/pages/ProfilePage.css";
import "@/styles/utils/buttons.css";
import Sidebar from "@/components/Sidebar/Sidebar";


export default function ProfilePage() {
  const { user, tier } = useAuth(); // ✅ from context
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isFileSidebarOpen, setFileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const openFileSystem = (propertyId) => {
    setSelectedPropertyId(propertyId);
    setFileSidebarOpen(true);
  };

  const closeFileSystem = () => {
    setSelectedPropertyId(null);
    setFileSidebarOpen(false);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Cycle: asc → desc → none
        const next =
          prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
            ? null
            : "asc";
        return { key: next ? key : null, direction: next };
      }
      return { key, direction: "asc" };
    });
  };

  const openBillingPortal = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/subscription/create-customer-portal-session",
        {},
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );

      if (res.data.portalUrl) {
        window.location.href = res.data.portalUrl;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error("❌ Error opening billing portal:", err.message);
      toast.error("Unable to open billing portal.");
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfileAndSubscribe = async () => {
      try {
        const profileData = await getUserMetadata(user.uid);
        setProfile(profileData);

        const unsubscribe = subscribeToProperties(user.uid, setProperties);
        return unsubscribe;
      } catch (err) {
        console.error("Error loading profile or properties:", err);
        toast.error("Something went wrong.");
      }
    };

    const unsubscribePromise = fetchProfileAndSubscribe();

    return () => {
      unsubscribePromise?.then((unsubscribe) => unsubscribe?.());
    };
  }, [user]);

  let filteredProperties = properties.filter((prop) => {
    const query = searchTerm.toLowerCase();
    return (
      prop.propertyAddress?.value?.toLowerCase().includes(query) ||
      prop.Category?.value?.toLowerCase().includes(query) ||
      String(prop.purchasePrice || "").includes(query) ||
      String(prop.UnitCount?.value || "").includes(query)
    );
  });

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔁 Apply sorting if config is set
  if (sortConfig.key && sortConfig.direction) {
    filteredProperties.sort((a, b) => {
      const aValue = extractSortableValue(a, sortConfig.key);
      const bValue = extractSortableValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  // 🔧 Helper to safely extract values
  function extractSortableValue(obj, key) {
    switch (key) {
      case "propertyAddress":
        return obj.propertyAddress?.value?.toLowerCase() || "";
      case "purchasePrice":
        return obj.purchasePrice || 0;
      case "UnitCount":
        return parseFloat(obj.UnitCount?.value || 0);
      case "Category":
        return obj.Category?.value?.toLowerCase() || "";
      default:
        return "";
    }
  }

  if (!user) {
    return (
      <div className="profile-page">Please log in to view your profile.</div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="profile-container">
        <section className="profile-header">
          <h1>👤 Your Profile</h1>
          <div className="profile-details">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Subscription:</strong> {tier}
            </p>
          </div>
        </section>

        <section className="property-section">
          <h2>🏠 Your Properties</h2>
          <input
            type="text"
            placeholder="Search by address, category, or price..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset page on search
            }}
            className="property-search-input"
          />

          {filteredProperties.length === 0 ? (
            <p className="empty-state">No properties match your search.</p>
          ) : (
            <table className="property-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("propertyAddress")}>Address</th>
                  <th onClick={() => handleSort("purchasePrice")}>
                    Purchase Price
                  </th>
                  <th onClick={() => handleSort("UnitCount")}>Units</th>
                  <th onClick={() => handleSort("Category")}>
                    Category{" "}
                    {sortConfig.key === "Category"
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>

                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProperties.map((prop) => (
                  <tr key={prop.id}>
                    <td>{prop.propertyAddress?.value || "Unnamed Property"}</td>
                    <td>
                      {typeof prop.purchasePrice === "number"
                        ? `$${prop.purchasePrice.toLocaleString()}`
                        : "N/A"}
                    </td>
                    <td>{prop.UnitCount?.value || "N/A"}</td>
                    <td>{prop.Category?.value || "N/A"}</td>
                    <td>
                      <button onClick={() => openFileSystem(prop.id)}>
                        📁 Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ◀ Prev
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next ▶
            </button>
          </div>
        </section>

        <button onClick={openBillingPortal}>Manage Subscription</button>
      </div>

      {selectedPropertyId && (
        <FileSystemSidebar
          propertyId={selectedPropertyId}
          isOpen={isFileSidebarOpen}
          onClose={closeFileSystem}
        />
      )}
    </>
  );
}
