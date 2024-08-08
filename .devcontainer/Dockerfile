FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

# [Optional] Uncomment if you want to install more global node modules
RUN su node -c "npm install -g pnpm@9"