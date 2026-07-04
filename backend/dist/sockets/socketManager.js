export const onlineUsers = new Map();
export const setUserOnline = (userId) => {
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
};
export const setUserOffline = (userId) => {
    const count = onlineUsers.get(userId) || 0;
    if (count <= 1) {
        onlineUsers.delete(userId);
    }
    else {
        onlineUsers.set(userId, count - 1);
    }
};
export const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};
//# sourceMappingURL=socketManager.js.map