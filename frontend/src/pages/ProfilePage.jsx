import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";
import "../styles/ProfilePage.css";
import FileSystemSidebar from "../components/Sidebar/FileSystem/FileSystemSidebar";

export default function ProfilePage() {
  const user = auth.currentUser;
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

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Unable to load profile.");
      }
    };

    const fetchProperties = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "properties")
        );
        setProperties(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error("Error fetching properties:", err);
        toast.error("Unable to load properties.");
      }
    };

    fetchProfile();
    fetchProperties();
  }, [user]);

  if (!user)
    return (
      <div className="profile-page">Please log in to view your profile.</div>
    );

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
              <strong>Subscription:</strong>{" "}
              {profile?.subscriptionTier || "Free"}
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
                  <h3>{prop.propertyAddress || "Unnamed Property"}</h3>
                  <p>
                    <strong>Purchase Price:</strong> $
                    {prop.purchasePrice?.toLocaleString() || "N/A"}
                  </p>
                  <p>
                    <strong>Units:</strong> {prop.UnitCount || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong> {prop.Category || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
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
