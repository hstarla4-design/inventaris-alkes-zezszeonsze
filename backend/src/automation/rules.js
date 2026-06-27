export const automationRules = [
  {
    name: "maintenance-reminder",
    enabled: true,
    execute: async () => {
      // Hook untuk reminder maintenance terjadwal.
    },
  },
  {
    name: "approval-escalation",
    enabled: true,
    execute: async () => {
      // Hook untuk eskalasi approval jika melewati SLA.
    },
  },
  {
    name: "vendor-email-dispatch",
    enabled: true,
    execute: async () => {
      // Hook untuk dispatch antrean email vendor.
    },
  },
];
