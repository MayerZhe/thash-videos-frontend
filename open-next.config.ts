// Validated against ensureCloudflareConfig source (ensure-cf-config.ts).
// All 11 requirements must pass: 6 default overrides + 4 middleware + 1 edgeExternals.
export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
  edgeExternals: ["node:crypto"],
};
