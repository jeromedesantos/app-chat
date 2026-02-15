import { login, register } from "@/services/authService";
import { connectSocket, disconnectSocket } from "@/socket/socket";
import { AuthContextProps, DecodedTokenProps, UserProps } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateToken: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    const storedToken = await AsyncStorage.getItem("token");

    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedTokenProps>(storedToken);
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          // token has expired, navigate to welcome page
          await AsyncStorage.removeItem("token");
          gotoWelcomePage();
          return;
        }
        // user is logged  in
        setToken(storedToken);
        setUser(decoded.user);
        // reconnect socket when resuming from app restart
        try {
          await connectSocket();
        } catch (socketError) {
          console.log("Failed to connect socket on app resume: ", socketError);
        }
        gotoHomePage();
      } catch (error) {
        gotoWelcomePage();
        console.log("failed to decode token: ", error);
      }
    } else {
      gotoWelcomePage();
    }
  };

  const gotoHomePage = () => {
    // wait is only for splash screen
    setTimeout(() => {
      router.replace("/(main)/home");
    }, 1500);
  };

  const gotoWelcomePage = () => {
    // wait is only for splash screen
    setTimeout(() => {
      router.replace("/(auth)/welcome");
    }, 1500);
  };

  const updateToken = async (token: string) => {
    if (token) {
      setToken(token);
      await AsyncStorage.setItem("token", token);

      // decode token (user)
      const decoded: any = jwtDecode<DecodedTokenProps>(token);
      console.log(decoded);
      setUser(decoded.user);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password);
    await updateToken(response.token);
    await connectSocket();
    router.replace("/(main)/home");
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    avatar?: string,
  ) => {
    const response = await register(email, password, name, avatar);
    await updateToken(response.token);
    await connectSocket();
    router.replace("/(main)/home");
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
    disconnectSocket();
    router.replace("/(auth)/welcome");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        signIn,
        signUp,
        signOut,
        updateToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
