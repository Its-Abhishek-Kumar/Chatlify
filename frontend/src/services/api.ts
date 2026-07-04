import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8080",
});

// ✅ Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const searchUsersAPI = (query: string) =>
  api.get(`/api/users/search?query=${query}`);

export const createConversationAPI = (userId: string) =>
  api.post("/api/conversations/create", { userId });

export const uploadFileAPI = (formData: FormData, onUploadProgress?: (progressEvent: any) => void) =>
  api.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

export const createGroupConversationAPI = (
  name: string,
  participantIds: string[],
  avatar?: string,
  type?: "group" | "channel" | "community",
  onlyAdminsCanPost?: boolean,
  communityId?: string
) =>
  api.post("/api/conversations/group", { name, participantIds, avatar, type, onlyAdminsCanPost, communityId });

export const updateProfileAPI = (profile: { name: string; username: string; avatar: string }) =>
  api.put("/api/users/profile", profile);

export const getSessionsAPI = () =>
  api.get("/api/sessions");

export const revokeSessionAPI = (id: string) =>
  api.delete(`/api/sessions/${id}`);


export const getConversationsAPI = () =>
  api.get("/api/conversations");

export const createStoryAPI = (mediaUrl: string, mediaType?: string) =>
  api.post("/api/stories/create", { mediaUrl, mediaType });

export const getStoriesAPI = () =>
  api.get("/api/stories");

export const deleteStoryAPI = (storyId: string) =>
  api.delete(`/api/stories/${storyId}`);

export const viewStoryAPI = (storyId: string) =>
  api.post(`/api/stories/${storyId}/view`);

export const toggleLikeStoryAPI = (storyId: string) =>
  api.post(`/api/stories/${storyId}/like`);

export const addConversationMembersAPI = (conversationId: string, participantIds: string[]) =>
  api.post("/api/conversations/add-members", { conversationId, participantIds });

export const removeConversationMembersAPI = (conversationId: string, participantIds: string[]) =>
  api.post("/api/conversations/remove-members", { conversationId, participantIds });

export const leaveConversationAPI = (conversationId: string) =>
  api.post(`/api/conversations/${conversationId}/leave`);

export const deleteConversationAPI = (conversationId: string) =>
  api.delete(`/api/conversations/${conversationId}`);

export const sendConnectionRequestAPI = (recipientId: string) =>
  api.post("/api/connections/request", { recipientId });

export const respondConnectionRequestAPI = (connectionId: string, action: "accept" | "reject") =>
  api.post("/api/connections/respond", { connectionId, action });

export const withdrawConnectionRequestAPI = (connectionId: string) =>
  api.post("/api/connections/withdraw", { connectionId });

export const removeConnectionAPI = (connectionId: string) =>
  api.delete(`/api/connections/${connectionId}`);

export const getConnectionsAPI = () =>
  api.get("/api/connections/list");

export const getConnectionNotificationsAPI = () =>
  api.get("/api/connections/notifications");

export const markConnectionNotificationsReadAPI = () =>
  api.post("/api/connections/notifications/read");
