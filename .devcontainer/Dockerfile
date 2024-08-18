FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

RUN wget https://github.com/stripe/stripe-cli/releases/download/v1.21.2/stripe_1.21.2_linux_arm64.deb
RUN dpkg -i stripe_1.21.2_linux_arm64.deb

# [Optional] Uncomment if you want to install more global node modules
RUN su node -c "npm install -g pnpm@9"