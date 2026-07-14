export const createIdempotentFinalizer = (finalize: () => void): (() => void) => {
  let finalized = false;
  return () => {
    if (finalized) return;
    finalized = true;
    finalize();
  };
};
