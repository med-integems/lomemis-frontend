"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, ApiResponse } from "@/types";

interface SessionInfo {
  id: string;
  userId: number;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  sessionId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> & { currentPassword?: string }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  getSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<{ email: string; name: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map roleName to UserRole
const mapRoleNameToRole = (roleName: string): User["role"] => {
  switch (roleName) {
    case "Super Administrator":
      return "super_admin";
    case "System Administrator":
      return "system_admin";
    case "National Warehouse Manager":
      return "national_manager";
    case "Local Council M&E Officer":
    case "LC M&E Officer":
      return "lc_officer";
    case "District Education Officer":
      return "district_officer";
    case "School Representative":
      return "school_rep";
    case "View-Only User":
      return "view_only";
    default:
      return "view_only";
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we're on the client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ApiResponse<any> = await response.json();
        if (data.success && data.data) {
          // Map the backend user object to frontend User type
          const mappedUser: User = {
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            role: mapRoleNameToRole(data.data.roleName || data.data.role),
            councilId: data.data.localCouncilId || data.data.councilId,
            warehouseId: data.data.warehouseId,
            schoolId: data.data.schoolId,
            district: data.data.district,
            isActive: data.data.isActive,
            createdAt: data.data.createdAt,
            updatedAt: data.data.updatedAt,
          };
          setUser(mappedUser);
        } else {
          localStorage.removeItem("auth_token");
        }
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data: ApiResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
      sessionId: string;
      expiresIn: number;
    }> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Login failed");
    }

    // Map the backend user object to frontend User type
    const mappedUser: User = {
      id: data.data.user.id,
      name: data.data.user.name,
      email: data.data.user.email,
      role: mapRoleNameToRole(data.data.user.roleName),
      councilId: data.data.user.localCouncilId,
      warehouseId: data.data.user.warehouseId,
      schoolId: data.data.user.schoolId,
      district: data.data.user.district,
      isActive: data.data.user.isActive,
      createdAt: data.data.user.createdAt,
      updatedAt: data.data.user.updatedAt,
    };

    // Store tokens and session info
    localStorage.setItem("auth_token", data.data.accessToken);
    localStorage.setItem("refresh_token", data.data.refreshToken);
    localStorage.setItem("session_id", data.data.sessionId);

    setUser(mappedUser);
    setSessionId(data.data.sessionId);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const sessionToken = localStorage.getItem("session_id");

      if (token) {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionToken }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("session_id");
      setUser(null);
      setSessionId(null);
      window.location.href = "/login";
    }
  };

  const updateProfile = async (profileData: Partial<User> & { currentPassword?: string }) => {
    if (typeof window === "undefined")
      throw new Error("Not available on server");

    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not authenticated");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data: ApiResponse<User> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Profile update failed");
    }

    setUser(data.data);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (typeof window === "undefined")
      throw new Error("Not available on server");

    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not authenticated");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/auth/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Password change failed");
    }
  };

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token");
      const sessionToken = localStorage.getItem("session_id");

      if (!refreshTokenValue) {
        return false;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshTokenValue,
          sessionToken,
        }),
      });

      const data: ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }> = await response.json();

      if (data.success && data.data) {
        localStorage.setItem("auth_token", data.data.accessToken);
        localStorage.setItem("refresh_token", data.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/validate-session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ApiResponse<{
        user: any;
        sessionValid: boolean;
        expiresAt: string;
      }> = await response.json();

      if (data.success && data.data?.sessionValid) {
        // Update user data if needed
        if (data.data.user) {
          const mappedUser: User = {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            role: mapRoleNameToRole(data.data.user.roleName),
            councilId: data.data.user.localCouncilId,
            warehouseId: data.data.user.warehouseId,
            schoolId: data.data.user.schoolId,
            district: data.data.user.district,
            isActive: data.data.user.isActive,
            createdAt: data.data.user.createdAt,
            updatedAt: data.data.user.updatedAt,
          };
          setUser(mappedUser);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("Session validation failed:", error);
      return false;
    }
  }, []);

  const getSessions = useCallback(async (): Promise<SessionInfo[]> => {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not authenticated");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/auth/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: ApiResponse<{ sessions: SessionInfo[] }> =
      await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Failed to fetch sessions");
    }

    return data.data.sessions.map((session) => ({
      ...session,
      expiresAt: new Date(session.expiresAt),
      lastActivity: new Date(session.lastActivity),
      createdAt: new Date(session.createdAt),
    }));
  }, []);

  const revokeSession = useCallback(
    async (sessionIdToRevoke: string): Promise<void> => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/auth/sessions/${sessionIdToRevoke}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to revoke session");
      }
    },
    []
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(
          data.error?.message || "Failed to request password reset"
        );
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<void> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to reset password");
      }
    },
    []
  );

  const validateResetToken = useCallback(
    async (token: string): Promise<{ email: string; name: string }> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/auth/validate-reset-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data: ApiResponse<{ email: string; name: string }> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to validate reset token");
      }

      return data.data!;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        sessionId,
        login,
        logout,
        updateProfile,
        changePassword,
        refreshToken,
        validateSession,
        getSessions,
        revokeSession,
        requestPasswordReset,
        validateResetToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
