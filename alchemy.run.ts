import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("opensurf", {
  stage: "prod",
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      email: process.env.CLOUDFLARE_EMAIL,
      apiToken: alchemy.secret(process.env.CLOUDFLARE_API_KEY),
    }),
});

export const website = await TanStackStart("website", {
  name: `${app.name}-${app.stage}-website`,
  bindings: {
    TURNSTILE_SECRET_KEY: alchemy.secret(process.env.TURNSTILE_SECRET_KEY),
    VITE_TURNSTILE_SITE_KEY: alchemy.secret(process.env.TURNSTILE_SITE_KEY),
    RESEND_API_KEY: alchemy.secret(process.env.RESEND_API_KEY),
    RESEND_AUDIENCE_ID: alchemy.secret(process.env.RESEND_AUDIENCE_ID),
  },
  domains: [
    {
      domainName: "opensurf.ai",
      adopt: true,
    },
  ],
  adopt: true,
  dev: {
    command: "vite dev --host localhost --port 5005",
  },
});

await app.finalize();
