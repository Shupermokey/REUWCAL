const CancelSubscription = ({ token }) => {
    const handleCancel = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/cancel-subscription", { // ✅ Updated URL          method: "POST",
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error("Cancellation failed:", error);
      }
    };
  
    return <div className="subscription-cancel-container">
         <button onClick={handleCancel}>Cancel Subscription</button>
      </div>
  };
  
  export default CancelSubscription;