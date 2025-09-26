/**
 * Error suppression utility for development
 * Suppresses noisy API authentication errors during development
 */

// Store the original console.error
const originalConsoleError = console.error;

// Override console.error to filter out noisy API errors
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.error = (...args: any[]) => {
    const message = args.join(" ");

    // Suppress API authentication errors
    if (
      message.includes("[API Error]") ||
      message.includes("Access token required") ||
      message.includes("MISSING_TOKEN") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      return; // Suppress the error
    }

    // Allow other errors through
    originalConsoleError.apply(console, args);
  };

  // Suppress hydration mismatch warnings in development (common during demo)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const originalWarn = console.warn;
    const hydrationMsgs = [
      "A tree hydrated but some attributes of the server rendered HTML didn't match",
      "hydrate",
      "hydration mismatch",
    ];
    console.warn = (...args: any[]) => {
      const msg = args?.[0]?.toString?.() || "";
      if (hydrationMsgs.some((h) => msg.includes(h))) {
        return; // suppress hydration warnings in dev
      }
      originalWarn.apply(console, args);
    };

    // Also suppress the specific console.error emitted for hydration mismatch
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = args?.[0]?.toString?.() || "";
      if (hydrationMsgs.some((h) => msg.includes(h))) {
        return;
      }
      originalError.apply(console, args);
    };
  }
}

export {};
