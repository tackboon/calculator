export const createWorker = () => {
  return new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
};
