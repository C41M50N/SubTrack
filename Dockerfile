FROM --platform=linux/amd64 node:lts-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node . /usr/src/app

# install pnpm
RUN wget -qO /bin/pnpm "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" && chmod +x /bin/pnpm

# Configure pnpm global
ENV PNPM_HOME=/pnpm-test/.pnpm
ENV PATH=$PATH:$PNPM_HOME

RUN pnpm install --ignore-scripts --frozen-lockfile
RUN pnpm dlx prisma generate
RUN pnpm build

USER node
ENTRYPOINT export PORT=8080 && pnpm start