import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ayuaura.app",
  appName: "AyuAura",
  webDir: "dist",
  server: {
    url: "https://ayuraura-gules.vercel.app",
    cleartext: false,
  },
};

export default config;
