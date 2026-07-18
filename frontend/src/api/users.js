import { apiClient } from "./client";

export const getAllUsers = () =>
  apiClient.get("/UsersAPis/GetAllUsers").then((res) => res.data);

export const getUserById = (id) =>
  apiClient.get(`/UsersAPis/GetUserById/${id}`).then((res) => res.data);

export const getUserByEmail = (email) =>
  apiClient
    .get("/UsersAPis/GetUserByEmail", { params: { email } })
    .then((res) => res.data);

export const getUserByPhone = (phoneNumber) =>
  apiClient
    .get("/UsersAPis/GetUserByPhone", { params: { phoneNumber } })
    .then((res) => res.data);

export const addUser = (dto) =>
  apiClient.post("/UsersAPis/AddUser", dto).then((res) => res.data);

export const updateUser = (dto) =>
  apiClient.put("/UsersAPis/UpdateUser", dto).then((res) => res.data);

export const deleteUser = (id) =>
  apiClient.delete(`/UsersAPis/DeleteUser/${id}`).then((res) => res.data);
