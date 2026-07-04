export const onlineUsers = new Map<string, number>();

export const setUserOnline = (userId: string) => {
  onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
};

export const setUserOffline = (userId: string) => {
  const count = onlineUsers.get(userId) || 0;

  if (count <= 1) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, count - 1);
  }
};

export const isUserOnline = (userId: string) => {
  return onlineUsers.has(userId);
};