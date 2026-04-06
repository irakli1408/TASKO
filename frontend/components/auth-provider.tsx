"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  CurrentUser,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserRoleType,
  loadStoredTokens,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  storeTokens
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  tokens: AuthTokens | null;
  login: (payload: LoginPayload) => Promise<CurrentUser>;
  register: (payload: RegisterPayload) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<CurrentUser | null>;
  setUser: (user: CurrentUser | null) => void;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_BUFFER_MS = 60_000;

function isTokenExpiredOrCloseToExpiry(expiresAtUtc: string) {
  const expiresAt = new Date(expiresAtUtc).getTime();

  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return expiresAt <= Date.now() + REFRESH_BUFFER_MS;
}

async function fetchCurrentUser(tokens: AuthTokens) {
  try {
    return await meRequest(tokens.accessToken);
  } catch (error) {
    const refreshed = await refreshRequest(tokens.refreshToken);
    storeTokens(refreshed);
    return meRequest(refreshed.accessToken);
  }
}

export function resolveHomePath(user: CurrentUser) {
  const isExecutor =
    user.isExecutorActive &&
    (user.roleType === UserRoleType.Executor || user.roleType === UserRoleType.Both);

  return isExecutor ? "/feed" : "/profile";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokens(null);
    setStatus("unauthenticated");
    storeTokens(null);
  }, []);

  const ensureFreshTokens = useCallback(
    async (candidateTokens: AuthTokens | null) => {
      if (!candidateTokens) {
        clearAuth();
        return null;
      }

      if (!isTokenExpiredOrCloseToExpiry(candidateTokens.accessTokenExpiresAtUtc)) {
        return candidateTokens;
      }

      try {
        const refreshed = await refreshRequest(candidateTokens.refreshToken);
        storeTokens(refreshed);
        setTokens(refreshed);
        return refreshed;
      } catch {
        clearAuth();
        return null;
      }
    },
    [clearAuth]
  );

  const applyTokensAndLoadUser = useCallback(
    async (nextTokens: AuthTokens) => {
      storeTokens(nextTokens);
      setTokens(nextTokens);

      try {
        const currentUser = await fetchCurrentUser(nextTokens);
        const latestTokens = loadStoredTokens() ?? nextTokens;
        setTokens(latestTokens);
        setUser(currentUser);
        setStatus("authenticated");
        return currentUser;
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    [clearAuth]
  );

  useEffect(() => {
    const bootstrap = async () => {
      const stored = loadStoredTokens();

      if (!stored) {
        setStatus("unauthenticated");
        return;
      }

      try {
        await applyTokensAndLoadUser(stored);
      } catch {
        clearAuth();
      }
    };

    void bootstrap();
  }, [applyTokensAndLoadUser, clearAuth]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const authTokens = await loginRequest(payload);
      return applyTokensAndLoadUser(authTokens);
    },
    [applyTokensAndLoadUser]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const authTokens = await registerRequest(payload);
      return applyTokensAndLoadUser(authTokens);
    },
    [applyTokensAndLoadUser]
  );

  const logout = useCallback(async () => {
    try {
      if (tokens) {
        await logoutRequest(tokens);
      }
    } finally {
      clearAuth();
    }
  }, [clearAuth, tokens]);

  const refreshMe = useCallback(async () => {
    if (!tokens) {
      clearAuth();
      return null;
    }

    const freshTokens = await ensureFreshTokens(tokens);

    if (!freshTokens) {
      return null;
    }

    return applyTokensAndLoadUser(freshTokens);
  }, [applyTokensAndLoadUser, clearAuth, ensureFreshTokens, tokens]);

  const getAccessToken = useCallback(async () => {
    const stored = loadStoredTokens() ?? tokens;

    const freshTokens = await ensureFreshTokens(stored);

    if (!freshTokens) {
      return null;
    }

    return freshTokens.accessToken;
  }, [ensureFreshTokens, tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      tokens,
      login,
      register,
      logout,
      refreshMe,
      setUser,
      getAccessToken
    }),
    [status, user, tokens, login, register, logout, refreshMe, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
