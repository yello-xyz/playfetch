# PlayFetch

PlayFetch makes adding Large Language Model features to your app quick and painless.

![playfetch](https://github.com/yello-xyz/playfetch/assets/6898258/98b931ce-3079-4361-b344-9e7766a33409)

## Context

LLMs have changed the way product teams are working.  Increasingly large parts of applications are now being built with natural language.  There are often non-engineering team members involved in this process — content strategists who care about the tone and delivery of the generated text, domain experts who are bringing highly specialised knowledge to generated content, and designers & product managers who have a deep understanding of their product needs.  With these new team members involved in prototyping, developing and maintaining critical parts of applications along side the engineering team there are lots of new interactions.

These new interactions between engineers and the rest of the team need new tooling. Engineers don’t want plain text distributed throughout their code bases with constant requests for updates only to find the new version isn’t actually better.  Contributors to prompts or chains don’t want to have to wait for an engineer to integrate their updates before finding that they don’t perform as expected. PlayFetch solves these and many other pain points we’ve observed in companies working this way.

## What is PlayFetch?

- An intuitive prompt playground built around collaboration with comments, annotations, labels, and ratings.
- A non-destructive versioning system that any team member can use transparently.
- A testing environment with data import and export, measurement chains, and automated chat bot testing.
- An LLM platform that seamlessly integrates with tools for source control, project management and vector stores.
- A model-agnostic hosting solution with a simple unified API supporting simple calls, chat, and manual interrupts.
- An analytics and monitoring solution focused around LLM feature needs.

## Deploying PlayFetch on Google Cloud

PlayFetch has been optimised to run on Google Cloud Platform. Follow the instructions below to get your own instance up and running.

- Fork the official PlayFetch repository at [https://github.com/yello-xyz/playfetch](https://github.com/yello-xyz/playfetch).
- Set up your Google Cloud Platform account on [https://cloud.google.com/](https://cloud.google.com/?hl=en).
- Click **NEW PROJECT** from the project selector.
- Pick a unique name (cannot be changed later).
- Navigate to **Billing** → **Account management** and ensure billing is enabled for the new project.
- Navigate to **APIs & Services** → **Enabled APIs & Services** and click **+ ENABLE APIS AND SERVICES**.
    - Search for **App Engine Admin API** and click **ENABLE**.
    - Search for **Cloud Build API** and click **ENABLE**.
    - Search for **Cloud Datastore API** and click **ENABLE**.
    - Search for **Cloud Scheduler API** and click **ENABLE**.
    - Search for **Google App Engine Flexible Environment** and click **ENABLE**.
    - Search for **Identity and Access Management (IAM) API** and click **ENABLE**.
    - Search for **Vertex AI API** and click **ENABLE**.
- Navigate to **App Engine** → **Dashboard** and click **CREATE APPLICATION**.
    - Pick a location (cannot be changed later).
    - Leave the service account option open (we’ll use the default).
    - Ignore the deployment panel (click **I’LL DO THIS LATER**).
- Navigate to **Datastore** and click **+ CREATE DATABASE**
    - Select **Datastore mode** and click **CREATE DATABASE**
    - Select **Time-to-live (TTL)** in the sidebar and click **+ CREATE POLICY**.
    - Set **Kind** to **_nextauth_token** and **Timestamp property** to **expires** and click **CREATE**.
    - Create another policy with kind **cache** and property **expiresAt**.
    - You may want to enable **Disaster Recovery** in the sidebar as well.
- Navigate to **Cloud Storage** → **Buckets** and select bucket **[project-name].appspot.com**.
    - Under **PERMISSIONS**, click **+ GRANT ACCESS**.
    - Assign role **Storage Object Viewer** to principal **allUsers**.
    - Click **SAVE** and **ALLOW PUBLIC ACCESS** (this bucket will be used for storing avatars).
- Navigate to **IAM & Admin** → **Service accounts** and click **+ CREATE SERVICE ACCOUNT**
    - Pick a unique name and click **CREATE AND CONTINUE**
    - Select role **Service Account User**
    - Click **+ ADD ANOTHER ROLE** and select **App Engine Deployer**
    - Click **+ ADD ANOTHER ROLE** and select **App Engine flexible environment Service Agent**
    - Click **+ ADD ANOTHER ROLE** and select **App Engine Service Admin**
    - Click **+ ADD ANOTHER ROLE** and select **Cloud Build Service Account**
    - Click **+ ADD ANOTHER ROLE** and select **Cloud Datastore Index Admin**
    - Click **+ ADD ANOTHER ROLE** and select **Cloud Scheduler Admin**
    - Click **CONTINUE** and **DONE**
- [optional but recommended] If you want to use Google to authenticate your users, follow the steps below:
    - Navigate to **APIs & Services** → **OAuth consent screen**.
    - Choose either **Internal** or **External** user type depending on your use case and click **CREATE**.
    - Fill in the required fields, click **SAVE AND CONTINUE**, then click **ADD OR REMOVE SCOPES**.
    - Check scope **.../auth/userinfo.profile** and **.../auth/userinfo.email**, then click **UPDATE** and **SAVE AND CONTINUE**.
    - If you picked **External** user type above, you will need to add some test accounts (or submit an approval request to Google). Make sure to include the email address you want to use for your first admin user.
    - Click **SAVE AND CONTINUE** and **BACK TO DASHBOARD**.
    - Navigate to **APIs & Services** → **Credentials**, then click **+ CREATE CREDENTIALS** and **OAuth client ID**.
    - Select **Web application** as **Application type** and pick a name
    - Under **Authorized JavaScript origins**, add **http://localhost:3000** and **https://[project-name].appspot.com**
    - Under **Authorized redirect URIs**, add **http://localhost:3000/api/auth/callback/google** and **https://[project-name].appspot.com/api/auth/callback/google**
    - Click **CREATE** and copy the generated Client ID and Client secret to use in the build trigger setup below.
- Navigate to **Cloud Build** → **Triggers** and click **CREATE TRIGGER**.
    - Pick a name for your build
    - Under **Source** → **Repository**, click **CONNECT TO NEW REPOSITORY**.
    - Choose source **GitHub (Cloud Build GitHub App)** and click **CONTINUE** to authenticate the GitHub account where you forked the repository
    - Select the forked repository and click **CONNECT**.
    - Under **Configuration**, select **Cloud Build configuration file (yaml or json)**.
    - For a minimum setup, you will need to add the following **Substitution variables** to your build trigger (in the **Advanced** section):
        - **_ENCRYPTION_KEY**: random string of 64 hexadecimal digits.
        - **_NEXTAUTH_SECRET**: random string of at least 32 characters.
        - **_NEXTAUTH_URL**: public facing URL for your instance (e.g. https://playfetch.ai), but for now you can enter **https://[project-name].appspot.com**.
        - **_NOREPLY_EMAIL_USER** and **_NOREPLY_EMAIL_PASSWORD**: Gmail account to be used for outgoing emails. Could be a dedicated account in a Google Workspace, or a separate Gmail account, but it cannot have two-factor authorisation enabled. If you need to use another email provider, you can configure it through **_NOREPLY_EMAIL_HOST** and **_NOREPLY_EMAIL_PORT**.
        - **_GCLOUD_STORAGE_BUCKET**: the name of the Cloud Storage bucket where you allowed public access e.g. **[project-name].appspot.com**.
    - If you configured Google authentication above, you should also add the following variables:
        - **_GOOGLE_CLIENT_ID** and **_GOOGLE_CLIENT_SECRET**: the values you copied above after generating OAuth credentials.
    - Under **Service account**, select the service account you created above.
    - Click **SAVE**.
    - Click **RUN** next to your newly new trigger and then click **RUN TRIGGER.**
- Navigate to **Cloud Build** → **History** and verify your first build completes successfully.
- Open a browser and navigate to **https://[project-name].appspot.com/api/admin/init?admin=[user@domain.com]**
    - Make sure to specify the correct email address for your first admin user in the query.
    - This endpoint will run a script to initialise the datastore but you will only be able to run it once (unless you delete the datastore first).
    - Once the script completes, copy the values for **_PLAYFETCH_API_KEY** and **_PLAYFETCH_ENDPOINT_URL** that are shown.
    - Navigate to **Cloud Build** → **Triggers**, click the trigger you created, add the two additional **Substitution variables** from the step above, and click **SAVE**.
    - You probably want to run your build trigger again now (with the added variables), but you don’t really need to wait for the build to complete.
- Navigate to **https://[project-name].appspot.com** and log in with the email address you specified for your first admin user. You can either Google authentication (if configured) or Email links (provided the **_NOREPLY_EMAIL** variables are set up correctly).

## Running PlayFetch locally

*Instructions below assume you are using Terminal on macOS.*

- **Install node and npm**
    - The easiest way to install the latest version of **node** and **npm** is to run the [latest installer](https://nodejs.org/en/download).
- **Clone the repository**
    - Either [Connect to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) and run
    - `git clone git@github.com:yello-xyz/playfetch.git`
    - Or just **Open with GitHub Desktop** and clone to a local directory.
- **Configure environment**
    - `cd ~/[LOCAL_DIRECTORY]/playfetch`
    - Assuming you have separate instances running on Google Cloud for development and production, you can access your dev datastore from your local machine, by installing the Google Cloud CLI and initialising it as explained [here](https://cloud.google.com/sdk/docs/install-sdk) (you can skip the other steps). Run the following commands to log in with your individual Google account:
        - `gcloud auth login`
        - `gcloud init`
        - `gcloud auth application-default login`
        - `gcloud init`
    - In order to run the app locally, you will also need to add some same variables to your local `.env.local` file (this file is ignored by source control to avoid leaking keys). These can be the same values as the ones you specified in your build trigger for your dev instance (again assuming you are running a separate instance for production), except for **_NEXTAUTH_URL** where you want to specify the value **http://localhost:3000.**
- **Build and run**
    - You should now be able to run the following commands:
        - `npm install`
        - `npm run build`
        - `npm run start`
    - Alternatively, during development, you can just run the following command to run a debug build with fast refresh:
        - `npm run dev`
    - To run all tests once:
        - `npm run test`
    - To watch for changes and automatically re-run the relevant test suites:
        - `npm run watch`

## Optional environment variables (GCP build trigger & .env.local)

- **_API_URL**: can be used to split traffic between website and api.
- **_GITHUB_CLIENT_ID**, **_GITHUB_CLIENT_SECRET**: can be used to configure GitHub authentication (similar to Google). Requires setting up a GitHub app.
- **_GITHUB_APP_CLIENT_ID**, **_GITHUB_APP_CLIENT_SECRET**, **_GITHUB_APP_ID**, **_GITHUB_APP_PRIVATE_KEY**, **_NEXT_PUBLIC_GITHUB_APP_INSTALL_LINK**: can be used to configure source control integration.
- **_LINEAR_APP_CLIENT_ID**, **_LINEAR_APP_CLIENT_SECRET**, **_LINEAR_APP_WEBHOOK_SECRET**: can be used to configure task management integration.
- **_GOOGLE_ANALYTICS_API_SECRET**, **_GOOGLE_ANALYTICS_MEASUREMENT_ID**, **_NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID**, **_NEXT_PUBLIC_COOKIE_DOMAIN**, **_NEXT_PUBLIC_COOKIE_NAME**: can be used to configure Google Analytics.
- **_GOOGLE_ANALYTICS_DASHBOARD_URL**, **_GOOGLE_ANALYTICS_REPORTS_URL**, **_GOOGLE_SEARCH_CONSOLE_URL**, **_INTEGRATION_TEST_URL**, **_SERVER_LOGS_URL**: can be used to add various diagnostic links in the Admin panel.
- **_NEXT_PUBLIC_DOCS_URL**, **_NEXT_PUBLIC_SUPPORT_EMAIL**: can be used to generate links to documentation and support in the workspace/project sidebars.
- **_NOTION_TOKEN, _NOTION_ONBOARDING_PAGE_ID, _NOTION_WAITLIST_PAGE_ID**: can be used to automatically synchronise waitlist signups and onboarding survey responses to Notion.

## License

PlayFetch is open source under a permissive [MIT](https://github.com/codemirror/dev/blob/master/LICENSE) license. It is being developed on [GitHub](https://github.com/yello-xyz/playfetch). Contributions are welcome.

Please note that PlayFetch uses [CodeMirror](https://codemirror.net) as a dependency. If you are using CodeMirror commercially, there is a social (but no legal) expectation that you [help fund its maintenance](https://marijnhaverbeke.nl/fund/).

## Contributing

Feel free to open issues or open pull requests when fixing bugs or adding features. To get you started, some inspiration can be found in [TODO.md](http://TODO.md).
