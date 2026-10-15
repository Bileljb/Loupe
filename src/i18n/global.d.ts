import type { routing } from "./routing";
import type messages from "../messages/en.json";

// Type-safe locales and message keys across next-intl APIs. English is the source of truth.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
