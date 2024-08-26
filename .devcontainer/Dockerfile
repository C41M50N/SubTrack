FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

# install Stripe CLI
RUN wget https://github.com/stripe/stripe-cli/releases/download/v1.21.2/stripe_1.21.2_linux_arm64.deb
RUN dpkg -i stripe_1.21.2_linux_arm64.deb

# install ngrok (for testing Clerk webhooks)
RUN wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz
RUN sudo tar -xvzf ngrok-v3-stable-linux-arm64.tgz -C /usr/local/bin

# [Optional] Uncomment if you want to install more global node modules
RUN su node -c "npm install -g pnpm@9"