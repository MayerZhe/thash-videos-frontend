// Minimum valid OpenNext config. Cloudflare adapter reads
// CloudflareOverrides (incrementalCache/tagCache/queue/cachePurge) from
// the top level; OpenNext base requires at least { default: {} }.
// All Cloudflare-specific fields default to "dummy".
export default {
  default: {},
};
