import { login as loginApi, registerOwner, registerTenant } from "../api/auth";
import { describeError } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { createContext, useContext, useState, useCallback } from "react";
import { MOCK_ACCOUNTS, INITIAL_PROPERTIES } from "../data/mockData";

const AuthContext = createContext(null);
const PropertyContext = createContext(null);
const NotificationContext = createContext(null);
const PlatformContext = createContext(null);

function loadProperties() {
  try {
    const saved = localStorage.getItem("smsrly_properties");
    return saved ? JSON.parse(saved) : [...INITIAL_PROPERTIES];
  } catch {
    return [...INITIAL_PROPERTIES];
  }
}
function saveProperties(props) {
  try {
    localStorage.setItem("smsrly_properties", JSON.stringify(props));
  } catch (err) {
    console.error(
      "Couldn't save properties to localStorage (possibly out of storage space):",
      err,
    );
  }
}

function loadNotifications() {
  try {
    const saved = localStorage.getItem("smsrly_notifications");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
function saveNotifications(list) {
  localStorage.setItem("smsrly_notifications", JSON.stringify(list));
}

function seedAllUsers() {
  const longAgo = Date.now() - 120 * 24 * 60 * 60 * 1000;
  return MOCK_ACCOUNTS.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    phone: a.phone || "",
    status: "Verified",
    verified: true,
    provider: "email",
    joined: longAgo,
    lastActivity: longAgo,
  }));
}
function loadAllUsers() {
  try {
    const saved = localStorage.getItem("smsrly_all_users");
    if (saved) return JSON.parse(saved);
  } catch {}
  const seeded = seedAllUsers();
  localStorage.setItem("smsrly_all_users", JSON.stringify(seeded));
  return seeded;
}
function saveAllUsers(list) {
  localStorage.setItem("smsrly_all_users", JSON.stringify(list));
}

const DEFAULT_PLATFORM_SETTINGS = {
  emailNotifications: true,
  autoVerifyListings: false,
  userRegistration: true,
  maintenanceMode: false,
};
function loadPlatformSettings() {
  try {
    const saved = localStorage.getItem("smsrly_platform_settings");
    if (saved) return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_PLATFORM_SETTINGS };
}
function savePlatformSettings(s) {
  localStorage.setItem("smsrly_platform_settings", JSON.stringify(s));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("smsrly_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [properties, setProperties] = useState(loadProperties);
  const [notifications, setNotifications] = useState(loadNotifications);
  const [allUsers, setAllUsers] = useState(loadAllUsers);
  const [platformSettings, setPlatformSettings] =
    useState(loadPlatformSettings);

  const addNotification = useCallback(
    (
      actor,
      { targetRole = null, targetUserId = null, type = "general", content },
    ) => {
      if (!actor || !actor.id) return;
      const entry = {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        targetRole,
        targetUserId,
        actorId: actor.id,
        actorName: actor.name,
        type,
        content,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [entry, ...prev].slice(0, 200);
        saveNotifications(updated);
        return updated;
      });
      return entry;
    },
    [],
  );

  const markNotificationsRead = useCallback((ids) => {
    setNotifications((prev) => {
      const idSet = new Set(ids);
      const updated = prev.map((n) =>
        idSet.has(n.id) ? { ...n, read: true } : n,
      );
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const upsertAllUser = useCallback((record) => {
    setAllUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === record.id);
      const updated =
        idx >= 0
          ? prev.map((u) => (u.id === record.id ? { ...u, ...record } : u))
          : [record, ...prev];
      saveAllUsers(updated);
      return updated;
    });
  }, []);

  const touchUserActivity = useCallback((id) => {
    setAllUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === id ? { ...u, lastActivity: Date.now() } : u,
      );
      saveAllUsers(updated);
      return updated;
    });
  }, []);

  const verifyUser = useCallback(
    (id, adminActor) => {
      setAllUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === id ? { ...u, status: "Verified", verified: true } : u,
        );
        saveAllUsers(updated);
        return updated;
      });
      addNotification(adminActor, {
        targetUserId: id,
        type: "account_verified",
        content:
          "Your account has been verified by an administrator. You now have full platform access.",
      });
    },
    [addNotification],
  );

  const flagUser = useCallback(
    (id, adminActor) => {
      setAllUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === id ? { ...u, status: "Flagged", verified: false } : u,
        );
        saveAllUsers(updated);
        return updated;
      });
      addNotification(adminActor, {
        targetUserId: id,
        type: "account_flagged",
        content:
          "Your account has been flagged for review by an administrator.",
      });
    },
    [addNotification],
  );

  const removeUser = useCallback((id) => {
    setAllUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      saveAllUsers(updated);
      return updated;
    });
  }, []);

  const updatePlatformSetting = useCallback((key, value) => {
    setPlatformSettings((prev) => {
      const updated = { ...prev, [key]: value };
      savePlatformSettings(updated);
      return updated;
    });
  }, []);

  const login = useCallback(
  async (email, password) => {
    try {
      const data = await loginApi(email, password);
      const backendUser = data.user || data;

      const rawRole = backendUser.Role || backendUser.role || backendUser.userType;
      let formattedRole = "";
      if (rawRole) {
        const roleStr = rawRole.toString().toLowerCase();
        if (roleStr === "admin") formattedRole = "Admin";
        else if (roleStr === "owner") formattedRole = "Owner";
        else if (roleStr === "tenant") formattedRole = "Tenant";
      }

      const safeUser = {
        id: backendUser.usserId || backendUser.id,
        email: backendUser.email || email,
        role: formattedRole,
        name: backendUser.firstName 
          ? `${backendUser.firstName} ${backendUser.lastName || ''}`.trim() 
          : (backendUser.name || email.split('@')[0]),
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
      };

      useAuthStore.getState().setAuth({
        accessToken: safeUser.accessToken,
        refreshToken: safeUser.refreshToken,
        role: safeUser.role,
        isAuthenticated: true
      });

      setUser(safeUser);
      localStorage.setItem("smsrly_user", JSON.stringify(safeUser));

      return {
        success: true,
        user: safeUser,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err.response?.status === 401
            ? "Invalid email or password."
            : describeError(err),
      };
    }
  },
  []
);
 const signup = useCallback(
  async (userData) => {
    try {
      let data;

      if (userData.role.toLowerCase() === "owner") {
        data = await registerOwner({
          firstName: userData.firstName,
          lastName: userData.lastName,
          nationalID: userData.nationalID,
          phoneNumber: userData.phoneNumber,
          email: userData.email,
          password: userData.password,
          businessTaxID: userData.businessTaxID,
        });
      } else {
        data = await registerTenant({
          firstName: userData.firstName,
          lastName: userData.lastName,
          nationalID: userData.nationalID,
          phoneNumber: userData.phoneNumber,
          email: userData.email,
          password: userData.password,
        });
      }

      const safeUser = {
        email: userData.email,
        role: data.role?.toLowerCase(),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      setUser(safeUser);
      localStorage.setItem("smsrly_user", JSON.stringify(safeUser));

      return {
        success: true,
        user: safeUser,
      };
    } catch (err) {
      return {
        success: false,
        error: describeError(err),
      };
    }
  },
  []
);
  const socialAuth = useCallback(
    (provider, email, name) => {
      const cleanEmail = email.trim().toLowerCase();
      const existing = MOCK_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === cleanEmail,
      );

      if (existing) {
        const { password: _, ...safeUser } = existing;
        const directoryRecord = allUsers.find((u) => u.id === safeUser.id);
        const mergedUser = directoryRecord?.avatar
          ? { ...safeUser, avatar: directoryRecord.avatar }
          : safeUser;
        setUser(mergedUser);
        localStorage.setItem("smsrly_user", JSON.stringify(mergedUser));
        touchUserActivity(mergedUser.id);
        upsertAllUser({ id: mergedUser.id, provider });
        return { success: true, user: mergedUser };
      }

      const id = "tenant_" + Date.now();
      const displayName = name?.trim() || cleanEmail.split("@")[0];
      const newAccount = {
        id,
        email: cleanEmail,
        password: `${provider}_oauth_${Date.now()}`,
        name: displayName,
        role: "tenant",
        phone: "",
        since: new Date().getFullYear(),
        savedProperties: [],
      };
      MOCK_ACCOUNTS.push(newAccount);
      const { password: _, ...safeUser } = newAccount;
      setUser(safeUser);
      localStorage.setItem("smsrly_user", JSON.stringify(safeUser));

      upsertAllUser({
        id,
        name: displayName,
        email: cleanEmail,
        role: "tenant",
        phone: "",
        status: "Pending",
        verified: false,
        provider,
        joined: Date.now(),
        lastActivity: Date.now(),
      });
      addNotification(safeUser, {
        targetRole: "admin",
        type: "user_signup",
        content: `New tenant account registered via ${provider[0].toUpperCase()}${provider.slice(1)}: ${displayName} (${cleanEmail}).`,
      });

      return { success: true, user: safeUser };
    },
    [touchUserActivity, upsertAllUser, addNotification, allUsers],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("smsrly_user");
    useAuthStore.getState().clearAuth();
  }, [setUser]);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("smsrly_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addProperty = useCallback(
    (propData, owner) => {
      const ownerId = owner?.id ?? propData.ownerId;
      const ownerName = owner?.name ?? propData.ownerName;
      const autoVerify = platformSettings.autoVerifyListings;
      const newProp = {
        ...propData,
        id: Date.now(),
        ownerId,
        ownerName,
        status: propData.status || "Active",
        tags: autoVerify ? ["VERIFIED", "NEW"] : ["NEW"],
        nearbyTags: propData.nearbyTags || [],
        inquiries: 0,
        views: 0,
        owner: propData.owner || {
          name: ownerName || "Property Owner",
          since: owner?.since || new Date().getFullYear(),
          rating: owner?.rating ?? 5,
          reviews: owner?.reviews ?? 0,
          phone: owner?.phone || "N/A",
        },
        nearby: propData.nearby || {
          pharmacy: {
            name: "Nearby Pharmacy",
            distance: "0.5 miles",
            phone: "N/A",
          },
          hospital: {
            name: "Nearby Hospital",
            distance: "1.0 miles",
            phone: "N/A",
          },
          police: {
            name: "Local Precinct",
            distance: "0.8 miles",
            phone: "Emergency: 911",
          },
        },
        lat: propData.lat || 30.0444,
        lng: propData.lng || 31.2357,
      };
      setProperties((prev) => {
        const u = [newProp, ...prev];
        saveProperties(u);
        return u;
      });

      if (owner && platformSettings.emailNotifications) {
        addNotification(owner, {
          targetRole: "admin",
          type: "listing_published",
          content: `New property "${newProp.title}" was published by ${ownerName}.`,
        });
        addNotification(owner, {
          targetUserId: ownerId,
          type: "listing_published",
          content: `Your property "${newProp.title}" has been published and is now live.`,
        });
      }

      return newProp;
    },
    [
      platformSettings.autoVerifyListings,
      platformSettings.emailNotifications,
      addNotification,
    ],
  );

  const updateProperty = useCallback((id, updates) => {
    setProperties((prev) => {
      const u = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveProperties(u);
      return u;
    });
  }, []);

  const deleteProperty = useCallback(
    (id, actor) => {
      setProperties((prev) => {
        const removed = prev.find((p) => p.id === id);
        const u = prev.filter((p) => p.id !== id);
        saveProperties(u);
        if (
          removed &&
          actor &&
          actor.role === "admin" &&
          actor.id !== removed.ownerId
        ) {
          addNotification(actor, {
            targetUserId: removed.ownerId,
            type: "listing_removed",
            content: `Your property "${removed.title}" was removed by an administrator.`,
          });
        }
        return u;
      });
    },
    [addNotification],
  );

  const toggleSavedProperty = useCallback((propId) => {
    setUser((prev) => {
      if (!prev) return prev;
      const saved = prev.savedProperties || [];
      const updated = saved.includes(propId)
        ? saved.filter((id) => id !== propId)
        : [...saved, propId];
      const newUser = { ...prev, savedProperties: updated };
      localStorage.setItem("smsrly_user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, signup, socialAuth, logout, updateUser }}
    >
      <PropertyContext.Provider
        value={{
          properties,
          addProperty,
          updateProperty,
          deleteProperty,
          toggleSavedProperty,
        }}
      >
        <NotificationContext.Provider
          value={{ notifications, addNotification, markNotificationsRead }}
        >
          <PlatformContext.Provider
            value={{
              allUsers,
              verifyUser,
              flagUser,
              removeUser,
              upsertAllUser,
              platformSettings,
              updatePlatformSetting,
            }}
          >
            {children}
          </PlatformContext.Provider>
        </NotificationContext.Provider>
      </PropertyContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
export function useProperties() {
  return useContext(PropertyContext);
}
export function useNotifications() {
  return useContext(NotificationContext);
}
export function usePlatform() {
  return useContext(PlatformContext);
}
