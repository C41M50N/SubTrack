# SubTrack
SubTrack is an intuitive subscriptions tracking utility. The goal of SubTrack is to facilitate a streamlined, non-invasive process of tracking your digital subscriptions. There is an optional integration with the Todoist platform that is used for creating cancel reminders for subscriptions. For more details -> [SubTrack Writeup](https://cbuff.dev/projects/subtrack)

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

![Dashboard Image](/public/dashboard.png)

## Tech Stack 🛠️
- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [shadcn](https://ui.shadcn.com)
- [React Email](https://react.email)
- [Resend](https://resend.com)

## Development using Dev Container 🐳
### Prerequisites
- [Docker](https://www.docker.com)
- [VSCode](https://code.visualstudio.com)
- [Dev Containers extension for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps
1. **Clone repository**
    ```bash
    git clone https://github.com/C41M50N/SubTrack.git "subtrack"
    ```

2. **Open in VSCode**
    ```bash
    cd subtrack
    code .
    ```

    - Open the Command Palette and run `Dev Containers: Reopen in Container`

3. **Wait**
    - The container will likely take a few minutes to build. But after it's done you should be ready to start hacking. Don't forget to setup your `.env` file based on the given `.env.example`.
