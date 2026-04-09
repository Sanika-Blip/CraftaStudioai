export const blockQueue = {
  add: async (name: string, data: any, options?: any) => {
    console.log("[Queue Disabled]");
    console.log("Job Name:", name);
    console.log("Data:", data);
    console.log("Options:", options);
  },
};

export const blockWorker = {
  on: () => {},
};