# Getting started
**Please help to keep this README.md updated if you find anything missing or inaccurate (but never commit any API keys or secrets to source control). Thank you!** 

*All instructions assume you are using Terminal on macOS.*
## Get Homebrew
Check if you have Homebrew installed:

`brew -v`

If not, install Homebrew:

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
## Install node and npm
Check if you have **node** installed:

`node -v`

If not, install node:

`brew install node`

Check if you have **npm** installed:

`npm -v`

If not, install node:

`brew install npm`
## Clone the repository
Either [Connect to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) and run:

`git clone git@github.com:yello-xyz/playfetch.git`

Or just **Open with GitHub Desktop** and clone to a local directory (recommended).

## Configure environment
`cd ~/[LOCAL_DIRECTORY]/playfetch`

In order to run the app locally, you will need to add some additional variables to your local `.env.local` file (this file is ignored by source control to avoid leaking keys). For most of these you should avoid using the same values as used in the production environment (e.g. generate your own API free keys so you don't risk messing up analytics or rate limits while testing locally):

`GITHUB_CLIENT_ID=` *[See https://github.com/organizations/yello-xyz/settings/apps/play-fetch-local]*

`GITHUB_CLIENT_SECRET=` *[Generate a new secret at https://github.com/organizations/yello-xyz/settings/apps/play-fetch-local]*

`GOOGLE_CLIENT_ID=` *[Copy this from Google Cloud Dev project → APIs & Services → Credentials → OAuth 2.0 Client IDs]*

`GOOGLE_CLIENT_SECRET=` *[Copy this from Google Cloud Dev project → APIs & Services → Credentials → OAuth 2.0 Client IDs]*

`NEXTAUTH_URL=http://localhost:3000`

`NEXTAUTH_SECRET=` *[random string of at least 32 characters]*

`NOREPLY_EMAIL_USER=no-reply@yello.xyz`

`NOREPLY_EMAIL_PASSWORD=` *[see "Gmail Service Account" in the 1Password Engineering vault]*

In order to access the Google Cloud Datastore from your local machine, you will need to install the Google Cloud CLI initialize it as explained [here](https://cloud.google.com/sdk/docs/install-sdk) (you can skip the other steps). Run the following commands to log in with your individual Google account (which should be added to the dev@yello.xyz group).

`gcloud auth login`

`gcloud init`

## Build and run
`npm install`

`npm run build`

`npm run start`

Alternatively, during development, you can just run the following command to run a debug build with fast refresh:

`npm run dev`

To run all tests once:

`npm run test`

To watch for changes and automatically re-run the relevant test suites:

`npm run watch`

## Branching strategy
You typically want to create a new feature branch for any changes and then merge them into the `dev` branch by creating a pull request (a.k.a. GitHub flow). Changes merged into `dev` can be tested live at `dev.playfetch.ai`. NEVER merge into the `main` branch directly (see Notion on Branches & Releases for more info).
## Caveats
- Think twice before using environment variables in the client side code, as these will be exposed in the browser. If you decide you do need them, you will need to prefix them with `NEXT_PUBLIC_` (which prevents you from exposing environment variables inadvertently). 
