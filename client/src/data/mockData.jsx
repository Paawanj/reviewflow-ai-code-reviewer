export const repositories = [
  { id: 1, name: "storefront", owner: "acme", language: "JavaScript", pullRequests: 4 },
  { id: 2, name: "api-service", owner: "acme", language: "Node.js", pullRequests: 2 },
  { id: 3, name: "design-system", owner: "acme", language: "React", pullRequests: 1 },
];

export const pullRequests = [
  { id: 101, title: "Add password reset flow", repository: "api-service", status: "open", score: 7.8, findings: 3 },
  { id: 102, title: "Improve checkout validation", repository: "storefront", status: "open", score: 8.6, findings: 1 },
  { id: 103, title: "Update button variants", repository: "design-system", status: "merged", score: 9.2, findings: 0 },
];
