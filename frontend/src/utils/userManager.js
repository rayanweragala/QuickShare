export const getOrCreateUserId = () => {
  let userId = localStorage.getItem("quickshare_user_id");
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("quickshare_user_id", userId);
  }

  return userId;
};

export const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};