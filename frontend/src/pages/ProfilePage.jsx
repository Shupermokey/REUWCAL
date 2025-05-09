import React, { useEffect, useState } from "react";
import {
  getUserMetadata,
  subscribeToProperties,
} from "../services/firestoreService";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";
import FileSystemSidebar from "../components/Sidebar/FileSystem/FileSystemSidebar";
import "../styles/ProfilePage.css";
import { useAuth } from "../app/AuthProvider";
import axios from "axios";

export default function ProfilePage() {
  const { user, tier } = useAuth(); // ✅ use context, not auth.currentUser
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isFileSidebarOpen, setFileSidebarOpen] = useState(false);

  const openFileSystem = (propertyId) => {
    setSelectedPropertyId(propertyId);
    setFileSidebarOpen(true);
  };

  const closeFileSystem = () => {
    setSelectedPropertyId(null);
    setFileSidebarOpen(false);
  };

  const openBillingPortal = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/subscription/create-customer-portal-session", // Your backend route
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
          {properties.length === 0 ? (
            <p className="empty-state">You haven’t added any properties yet.</p>
          ) : (
            <div className="property-grid">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="property-card"
                  onClick={() => openFileSystem(prop.id)}
                  style={{ cursor: "pointer" }}
                >
                  <h3>{prop.propertyAddress?.value || "Unnamed Property"}</h3>

                  <p>
                    <strong>Purchase Price:</strong> $
                    {typeof prop.purchasePrice === "number"
                      ? prop.purchasePrice.toLocaleString()
                      : "N/A"}
                  </p>

                  <p>
                    <strong>Units:</strong> {prop.UnitCount?.value || "N/A"}
                  </p>

                  <p>
                    <strong>Category:</strong> {prop.Category?.value || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
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
