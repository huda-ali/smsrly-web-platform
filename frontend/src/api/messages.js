import { apiClient } from "./client";

export const getMessagesBetween = (ownerId, tenantId) =>
  apiClient
    .get("/MessageApis/GetMessagesBetween", { params: { ownerId, tenantId } })
    .then((res) => res.data);

export const getUnreadMessages = (ownerId, tenantId) =>
  apiClient
    .get("/MessageApis/GetUnreadMessages", { params: { ownerId, tenantId } })
    .then((res) => res.data);

export const getAllMessages = () =>
  apiClient.get("/MessageApis/GetAllMessages").then((res) => res.data);

export const getMessageById = (id) =>
  apiClient.get(`/MessageApis/GetMessageByID/${id}`).then((res) => res.data);

export const addMessage = (dto) =>
  apiClient.post("/MessageApis/AddMessage", dto).then((res) => res.data);

export const updateMessage = (id, dto) =>
  apiClient
    .put(`/MessageApis/UpdateMessage/${id}`, { ...dto, messageID: id })
    .then((res) => res.data);

export const markMessageAsRead = (messageId) =>
  apiClient.put(`/MessageApis/MarkAsRead/${messageId}`).then((res) => res.data);

export const deleteMessage = (id) =>
  apiClient
    .delete(`/MessageApis/SoftDeleteMessage/${id}`)
    .then((res) => res.data);
