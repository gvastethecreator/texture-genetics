import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetObjectUrlRegistry } from "@/shared/utils/objectUrls";

const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
const nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);

const restoreNativeObjectUrls = () => {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: nativeCreateObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: nativeRevokeObjectURL,
  });
};

// Vitest reuses one jsdom worker to keep the suite reliable on constrained hosts.
// Make the DOM boundary explicit because Testing Library's implicit hook is scoped
// to the first setup registration when test-file isolation is disabled.
afterEach(() => {
  cleanup();
  resetObjectUrlRegistry();
  restoreNativeObjectUrls();
});
