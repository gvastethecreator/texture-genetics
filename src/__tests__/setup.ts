import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest reuses one jsdom worker to keep the suite reliable on constrained hosts.
// Make the DOM boundary explicit because Testing Library's implicit hook is scoped
// to the first setup registration when test-file isolation is disabled.
afterEach(() => cleanup());
