import React from "react";
// other imports...
import PlansSettings from "./PlansSettings";

function Settings() {
  // existing state and functions...

  return (
    <div>
      <h1>Settings</h1>
      <div className="tabs">
        {/* Existing tabs */}
        <button onClick={() => setActiveTab("general")}>General</button>
        <button onClick={() => setActiveTab("notifications")}>
          Notifications
        </button>

        {/* New Plans tab */}
        <button onClick={() => setActiveTab("plans")}>Plans</button>
      </div>
      {/* Tab content rendering */}
      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "notifications" && <NotificationSettings />}
      {activeTab === "plans" && <PlansSettings />}{" "}
      {/* New PlansSettings component */}
    </div>
  );
}

// existing code...

// existing code...
