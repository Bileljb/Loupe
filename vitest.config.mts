import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Checks, scoring and storage logic are pure server-side functions.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
