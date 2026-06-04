export const logActivity = (type, message, relatedId = null) => {
  if (typeof window === "undefined") return;

  const activity = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
    type, // 'created', 'completed', 'assigned', 'system'
    message,
    relatedId,
    time: Date.now()
  };

  try {
    const existing = JSON.parse(localStorage.getItem("app_activities") || "[]");
    const updated = [activity, ...existing].slice(0, 100); // keep last 100
    localStorage.setItem("app_activities", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

export const getActivities = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("app_activities") || "[]");
  } catch (err) {
    console.error("Failed to get activities:", err);
    return [];
  }
};
