FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS build
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/moderation ./services/moderation
COPY services/matching ./services/matching
COPY apps/api ./apps/api
RUN pnpm install --filter @blesscupid/api... --filter @blesscupid/shared --filter @blesscupid/matching --filter @blesscupid/moderation
# Build workspace deps first — api imports their compiled dist/.
RUN pnpm --filter @blesscupid/shared run build \
 && pnpm --filter @blesscupid/matching run build \
 && pnpm --filter @blesscupid/moderation run build
RUN pnpm --filter @blesscupid/api exec prisma generate \
 && pnpm --filter @blesscupid/api run build
# Prisma v5.22 bug: default.d.ts is empty under pnpm; fix it so imports resolve.
RUN PRISMA_CLIENT=$(find /repo/node_modules/.pnpm -path '*/@prisma/client' -maxdepth 3 | head -1) \
 && .prisma_client=$(dirname "$PRISMA_CLIENT")/.prisma/client \
 && echo "export * from './index'" > "$PRISMA_CLIENT/default.d.ts" \
 && echo "module.exports = require('./index')" > "$PRISMA_CLIENT/default.js" \
 && echo "export * from './index'" > "$PRISMA_CLIENT/index.d.ts" \
 || true

FROM base AS runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/services/moderation ./services/moderation
COPY --from=build /repo/services/matching ./services/matching
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
# pnpm uses isolated node_modules with symlinks into /repo/node_modules/.pnpm.
# The api package's bins (prisma, nest) and direct deps live here, so it must
# ship in the runtime image for both `node dist/main.js` and the Fly release
# command (`prisma migrate deploy`) to resolve modules correctly.
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
