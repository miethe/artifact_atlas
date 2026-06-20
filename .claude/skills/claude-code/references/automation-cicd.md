# Automation, CI/CD & Scheduling

_Claude Code documentation — Automation, CI/CD & Scheduling. Source: https://code.claude.com/docs/en/_


---

## Claude Code GitHub Actions

`https://code.claude.com/docs/en/github-actions`

Learn about integrating Claude Code into your development workflow with Claude Code GitHub Actions

Claude Code GitHub Actions brings AI-powered automation to your GitHub workflow. With a simple `@claude` mention in any PR or issue, Claude can analyze your code, create pull requests, implement features, and fix bugs - all while following your project's standards. For automatic reviews posted on every PR without a trigger, see [GitHub Code Review](/docs/en/code-review).

<Note>
  Claude Code GitHub Actions is built on top of the [Claude Agent SDK](/docs/en/agent-sdk/overview), which enables programmatic integration of Claude Code into your applications. You can use the SDK to build custom automation workflows beyond GitHub Actions.
</Note>

<Info>
  **Claude Opus 4.8 is now available.** Claude Code GitHub Actions default to Sonnet. To use Opus 4.8, configure the [model parameter](#breaking-changes-reference) to use `claude-opus-4-8`.
</Info>

## Why use Claude Code GitHub Actions?

* **Instant PR creation**: Describe what you need, and Claude creates a complete PR with all necessary changes
* **Automated code implementation**: Turn issues into working code with a single command
* **Follows your standards**: Claude respects your `CLAUDE.md` guidelines and existing code patterns
* **Simple setup**: Get started in minutes with our installer and API key
* **Secure by default**: Your code stays on Github's runners

## What can Claude do?

Claude Code provides a powerful GitHub Action that transforms how you work with code:

### Claude Code Action

This GitHub Action allows you to run Claude Code within your GitHub Actions workflows. You can use this to build any custom workflow on top of Claude Code.

[View repository →](https://github.com/anthropics/claude-code-action)

## Setup

## Quick setup

The easiest way to set up this action is through Claude Code in the terminal. Just open claude and run `/install-github-app`.

This command will guide you through setting up the GitHub app and required secrets.

<Note>
  * You must be a repository admin to install the GitHub app and add secrets
  * The GitHub app will request read & write permissions for Contents, Issues, and Pull requests
  * This quickstart method is only available for direct Claude API users. If
    you're using Amazon Bedrock or Google Vertex AI, see the [Using with Amazon
    Bedrock & Google Vertex AI](#using-with-amazon-bedrock-%26-google-vertex-ai)
    section.
</Note>

## Manual setup

If the `/install-github-app` command fails or you prefer manual setup, please follow these manual setup instructions:

1. **Install the Claude GitHub app** to your repository: [https://github.com/apps/claude](https://github.com/apps/claude)

   The Claude GitHub app requires the following repository permissions:

   * **Contents**: Read & write (to modify repository files)
   * **Issues**: Read & write (to respond to issues)
   * **Pull requests**: Read & write (to create PRs and push changes)

   For more details on security and permissions, see the [security documentation](https://github.com/anthropics/claude-code-action/blob/main/docs/security.md).
2. **Add ANTHROPIC\_API\_KEY** to your repository secrets ([Learn how to use secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions))
3. **Copy the workflow file** from [examples/claude.yml](https://github.com/anthropics/claude-code-action/blob/main/examples/claude.yml) into your repository's `.github/workflows/`

<Tip>
  After completing either the quickstart or manual setup, test the action by tagging `@claude` in an issue or PR comment.
</Tip>

## Upgrading from Beta

<Warning>
  Claude Code GitHub Actions v1.0 introduces breaking changes that require updating your workflow files in order to upgrade to v1.0 from the beta version.
</Warning>

If you're currently using the beta version of Claude Code GitHub Actions, we recommend that you update your workflows to use the GA version. The new version simplifies configuration while adding powerful new features like automatic mode detection.

### Essential changes

All beta users must make these changes to their workflow files in order to upgrade:

1. **Update the action version**: Change `@beta` to `@v1`
2. **Remove mode configuration**: Delete `mode: "tag"` or `mode: "agent"` (now auto-detected)
3. **Update prompt inputs**: Replace `direct_prompt` with `prompt`
4. **Move CLI options**: Convert `max_turns`, `model`, `custom_instructions`, etc. to `claude_args`

### Breaking Changes Reference

| Old Beta Input        | New v1.0 Input                        |
| --------------------- | ------------------------------------- |
| `mode`                | *(Removed - auto-detected)*           |
| `direct_prompt`       | `prompt`                              |
| `override_prompt`     | `prompt` with GitHub variables        |
| `custom_instructions` | `claude_args: --append-system-prompt` |
| `max_turns`           | `claude_args: --max-turns`            |
| `model`               | `claude_args: --model`                |
| `allowed_tools`       | `claude_args: --allowedTools`         |
| `disallowed_tools`    | `claude_args: --disallowedTools`      |
| `claude_env`          | `settings` JSON format                |

### Before and After Example

**Beta version:**

```yaml theme={null}
- uses: anthropics/claude-code-action@beta
  with:
    mode: "tag"
    direct_prompt: "Review this PR for security issues"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    custom_instructions: "Follow our coding standards"
    max_turns: "10"
    model: "claude-sonnet-4-6"
```

**GA version (v1.0):**

```yaml theme={null}
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR for security issues"
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_args: |
      --append-system-prompt "Follow our coding standards"
      --max-turns 10
      --model claude-sonnet-4-6
```

<Tip>
  The action now automatically detects whether to run in interactive mode (responds to `@claude` mentions) or automation mode (runs immediately with a prompt) based on your configuration.
</Tip>

## Example use cases

Claude Code GitHub Actions can help you with a variety of tasks. The [examples directory](https://github.com/anthropics/claude-code-action/tree/main/examples) contains ready-to-use workflows for different scenarios.

### Basic workflow

```yaml theme={null}
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # Responds to @claude mentions in comments
```

### Using skills

The `prompt` input accepts a [skill](/docs/en/skills) invocation as well as plain text:

* For a skill in your repository's `.claude/skills/` directory, run `actions/checkout` before the action step and pass `/skill-name`.
* For a skill packaged in a plugin, install the plugin with the `plugin_marketplaces` and `plugins` inputs and pass the namespaced `/plugin-name:skill-name`.

The following workflow installs the `code-review` plugin and runs its skill on each new or updated pull request:

```yaml theme={null}
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
```

### Custom automation with prompts

```yaml theme={null}
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: "--model opus"
```

### Common use cases

In issue or PR comments:

```text theme={null}
@claude implement this feature based on the issue description
@claude how should I implement user authentication for this endpoint?
@claude fix the TypeError in the user dashboard component
```

Claude will automatically analyze the context and respond appropriately.

## Best practices

### CLAUDE.md configuration

Create a `CLAUDE.md` file in your repository root to define code style guidelines, review criteria, project-specific rules, and preferred patterns. This file guides Claude's understanding of your project standards.

### Security considerations

<Warning>Never commit API keys directly to your repository.</Warning>

For comprehensive security guidance including permissions, authentication, and best practices, see the [Claude Code Action security documentation](https://github.com/anthropics/claude-code-action/blob/main/docs/security.md).

Always use GitHub Secrets for API keys:

* Add your API key as a repository secret named `ANTHROPIC_API_KEY`
* Reference it in workflows: `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`
* Limit action permissions to only what's necessary
* Review Claude's suggestions before merging

Always use GitHub Secrets (for example, `${{ secrets.ANTHROPIC_API_KEY }}`) rather than hardcoding API keys directly in your workflow files.

### Optimizing performance

Use issue templates to provide context, keep your `CLAUDE.md` concise and focused, and configure appropriate timeouts for your workflows.

### CI costs

When using Claude Code GitHub Actions, be aware of the associated costs:

**GitHub Actions costs:**

* Claude Code runs on GitHub-hosted runners, which consume your GitHub Actions minutes
* See [GitHub's billing documentation](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions) for detailed pricing and minute limits

**API costs:**

* Each Claude interaction consumes API tokens based on the length of prompts and responses
* Token usage varies by task complexity and codebase size
* See [Claude's pricing page](https://claude.com/platform/api) for current token rates

**Cost optimization tips:**

* Use specific `@claude` commands to reduce unnecessary API calls
* Configure appropriate `--max-turns` in `claude_args` to prevent excessive iterations
* Set workflow-level timeouts to avoid runaway jobs
* Consider using GitHub's concurrency controls to limit parallel runs

## Configuration examples

The Claude Code Action v1 simplifies configuration with unified parameters:

```yaml theme={null}
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "Your instructions here" # Optional
    claude_args: "--max-turns 5" # Optional CLI arguments
```

Key features:

* **Unified prompt interface** - Use `prompt` for all instructions
* **Skills** - Invoke installed [skills](/docs/en/skills) directly from the prompt
* **CLI passthrough** - Any Claude Code CLI argument via `claude_args`
* **Flexible triggers** - Works with any GitHub event

Visit the [examples directory](https://github.com/anthropics/claude-code-action/tree/main/examples) for complete workflow files.

<Tip>
  When responding to issue or PR comments, Claude automatically responds to @claude mentions. For other events, use the `prompt` parameter to provide instructions.
</Tip>

## Using with Amazon Bedrock & Google Vertex AI

For enterprise environments, you can use Claude Code GitHub Actions with your own cloud infrastructure. This approach gives you control over data residency and billing while maintaining the same functionality.

### Prerequisites

Before setting up Claude Code GitHub Actions with cloud providers, you need:

#### For Google Cloud Vertex AI:

1. A Google Cloud Project with Vertex AI enabled
2. Workload Identity Federation configured for GitHub Actions
3. A service account with the required permissions
4. A GitHub App (recommended) or use the default GITHUB\_TOKEN

#### For Amazon Bedrock:

1. An AWS account with Amazon Bedrock enabled
2. GitHub OIDC Identity Provider configured in AWS
3. An IAM role with Bedrock permissions
4. A GitHub App (recommended) or use the default GITHUB\_TOKEN

<Steps>
  <Step title="Create a custom GitHub App (Recommended for 3P Providers)">
    For best control and security when using 3P providers like Vertex AI or Bedrock, we recommend creating your own GitHub App:

    1. Go to [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
    2. Fill in the basic information:
       * **GitHub App name**: Choose a unique name (e.g., "YourOrg Claude Assistant")
       * **Homepage URL**: Your organization's website or the repository URL
    3. Configure the app settings:
       * **Webhooks**: Uncheck "Active" (not needed for this integration)
    4. Set the required permissions:
       * **Repository permissions**:
         * Contents: Read & Write
         * Issues: Read & Write
         * Pull requests: Read & Write
    5. Click "Create GitHub App"
    6. After creation, click "Generate a private key" and save the downloaded `.pem` file
    7. Note your App ID from the app settings page
    8. Install the app to your repository:
       * From your app's settings page, click "Install App" in the left sidebar
       * Select your account or organization
       * Choose "Only select repositories" and select the specific repository
       * Click "Install"
    9. Add the private key as a secret to your repository:
       * Go to your repository's Settings → Secrets and variables → Actions
       * Create a new secret named `APP_PRIVATE_KEY` with the contents of the `.pem` file
    10. Add the App ID as a secret:

    * Create a new secret named `APP_ID` with your GitHub App's ID

    <Note>
      This app will be used with the [actions/create-github-app-token](https://github.com/actions/create-github-app-token) action to generate authentication tokens in your workflows.
    </Note>

    **Alternative for Claude API or if you don't want to setup your own Github app**: Use the official Anthropic app:

    1. Install from: [https://github.com/apps/claude](https://github.com/apps/claude)
    2. No additional configuration needed for authentication
  </Step>

  <Step title="Configure cloud provider authentication">
    Choose your cloud provider and set up secure authentication:

    <AccordionGroup>
      <Accordion title="Amazon Bedrock">
        **Configure AWS to allow GitHub Actions to authenticate securely without storing credentials.**

        > **Security Note**: Use repository-specific configurations and grant only the minimum required permissions.

        **Required Setup**:

        1. **Enable Amazon Bedrock**:
           * Request access to Claude models in Amazon Bedrock
           * For cross-region models, request access in all required regions

        2. **Set up GitHub OIDC Identity Provider**:
           * Provider URL: `https://token.actions.githubusercontent.com`
           * Audience: `sts.amazonaws.com`

        3. **Create IAM Role for GitHub Actions**:
           * Trusted entity type: Web identity
           * Identity provider: `token.actions.githubusercontent.com`
           * Permissions: `AmazonBedrockFullAccess` policy
           * Configure trust policy for your specific repository

        **Required Values**:

        After setup, you'll need:

        * **AWS\_ROLE\_TO\_ASSUME**: The ARN of the IAM role you created

        <Tip>
          OIDC is more secure than using static AWS access keys because credentials are temporary and automatically rotated.
        </Tip>

        See [AWS documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) for detailed OIDC setup instructions.
      </Accordion>

      <Accordion title="Google Vertex AI">
        **Configure Google Cloud to allow GitHub Actions to authenticate securely without storing credentials.**

        > **Security Note**: Use repository-specific configurations and grant only the minimum required permissions.

        **Required Setup**:

        1. **Enable APIs** in your Google Cloud project:
           * IAM Credentials API
           * Security Token Service (STS) API
           * Vertex AI API

        2. **Create Workload Identity Federation resources**:
           * Create a Workload Identity Pool
           * Add a GitHub OIDC provider with:
             * Issuer: `https://token.actions.githubusercontent.com`
             * Attribute mappings for repository and owner
             * **Security recommendation**: Use repository-specific attribute conditions

        3. **Create a Service Account**:
           * Grant only `Vertex AI User` role
           * **Security recommendation**: Create a dedicated service account per repository

        4. **Configure IAM bindings**:
           * Allow the Workload Identity Pool to impersonate the service account
           * **Security recommendation**: Use repository-specific principal sets

        **Required Values**:

        After setup, you'll need:

        * **GCP\_WORKLOAD\_IDENTITY\_PROVIDER**: The full provider resource name
        * **GCP\_SERVICE\_ACCOUNT**: The service account email address

        <Tip>
          Workload Identity Federation eliminates the need for downloadable service account keys, improving security.
        </Tip>

        For detailed setup instructions, consult the [Google Cloud Workload Identity Federation documentation](https://cloud.google.com/iam/docs/workload-identity-federation).
      </Accordion>
    </AccordionGroup>
  </Step>

  <Step title="Add Required Secrets">
    Add the following secrets to your repository (Settings → Secrets and variables → Actions):

    #### For Claude API (Direct):

    1. **For API Authentication**:
       * `ANTHROPIC_API_KEY`: Your Claude API key from [console.anthropic.com](https://console.anthropic.com)

    2. **For GitHub App (if using your own app)**:
       * `APP_ID`: Your GitHub App's ID
       * `APP_PRIVATE_KEY`: The private key (.pem) content

    #### For Google Cloud Vertex AI

    1. **For GCP Authentication**:
       * `GCP_WORKLOAD_IDENTITY_PROVIDER`
       * `GCP_SERVICE_ACCOUNT`

    2. **For GitHub App (if using your own app)**:
       * `APP_ID`: Your GitHub App's ID
       * `APP_PRIVATE_KEY`: The private key (.pem) content

    #### For Amazon Bedrock

    1. **For AWS Authentication**:
       * `AWS_ROLE_TO_ASSUME`

    2. **For GitHub App (if using your own app)**:
       * `APP_ID`: Your GitHub App's ID
       * `APP_PRIVATE_KEY`: The private key (.pem) content
  </Step>

  <Step title="Create workflow files">
    Create GitHub Actions workflow files that integrate with your cloud provider. The examples below show complete configurations for both Amazon Bedrock and Google Vertex AI:

    <AccordionGroup>
      <Accordion title="Amazon Bedrock workflow">
        **Prerequisites:**

        * Amazon Bedrock access enabled with Claude model permissions
        * GitHub configured as an OIDC identity provider in AWS
        * IAM role with Bedrock permissions that trusts GitHub Actions

        **Required GitHub secrets:**

        | Secret Name          | Description                                       |
        | -------------------- | ------------------------------------------------- |
        | `AWS_ROLE_TO_ASSUME` | ARN of the IAM role for Bedrock access            |
        | `APP_ID`             | Your GitHub App ID (from app settings)            |
        | `APP_PRIVATE_KEY`    | The private key you generated for your GitHub App |

        ```yaml theme={null}
        name: Claude PR Action

        permissions:
          contents: write
          pull-requests: write
          issues: write
          id-token: write

        on:
          issue_comment:
            types: [created]
          pull_request_review_comment:
            types: [created]
          issues:
            types: [opened, assigned]

        jobs:
          claude-pr:
            if: |
              (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
              (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
              (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
            runs-on: ubuntu-latest
            env:
              AWS_REGION: us-west-2
            steps:
              - name: Checkout repository
                uses: actions/checkout@v4

              - name: Generate GitHub App token
                id: app-token
                uses: actions/create-github-app-token@v2
                with:
                  app-id: ${{ secrets.APP_ID }}
                  private-key: ${{ secrets.APP_PRIVATE_KEY }}

              - name: Configure AWS Credentials (OIDC)
                uses: aws-actions/configure-aws-credentials@v4
                with:
                  role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
                  aws-region: us-west-2

              - uses: anthropics/claude-code-action@v1
                with:
                  github_token: ${{ steps.app-token.outputs.token }}
                  use_bedrock: "true"
                  claude_args: '--model us.anthropic.claude-sonnet-4-6 --max-turns 10'
        ```

        <Tip>
          The model ID format for Bedrock includes a region prefix (for example, `us.anthropic.claude-sonnet-4-6`).
        </Tip>
      </Accordion>

      <Accordion title="Google Vertex AI workflow">
        **Prerequisites:**

        * Vertex AI API enabled in your GCP project
        * Workload Identity Federation configured for GitHub
        * Service account with Vertex AI permissions

        **Required GitHub secrets:**

        | Secret Name                      | Description                                       |
        | -------------------------------- | ------------------------------------------------- |
        | `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload identity provider resource name          |
        | `GCP_SERVICE_ACCOUNT`            | Service account email with Vertex AI access       |
        | `APP_ID`                         | Your GitHub App ID (from app settings)            |
        | `APP_PRIVATE_KEY`                | The private key you generated for your GitHub App |

        ```yaml theme={null}
        name: Claude PR Action

        permissions:
          contents: write
          pull-requests: write
          issues: write
          id-token: write

        on:
          issue_comment:
            types: [created]
          pull_request_review_comment:
            types: [created]
          issues:
            types: [opened, assigned]

        jobs:
          claude-pr:
            if: |
              (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
              (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
              (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
            runs-on: ubuntu-latest
            steps:
              - name: Checkout repository
                uses: actions/checkout@v4

              - name: Generate GitHub App token
                id: app-token
                uses: actions/create-github-app-token@v2
                with:
                  app-id: ${{ secrets.APP_ID }}
                  private-key: ${{ secrets.APP_PRIVATE_KEY }}

              - name: Authenticate to Google Cloud
                id: auth
                uses: google-github-actions/auth@v2
                with:
                  workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
                  service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

              - uses: anthropics/claude-code-action@v1
                with:
                  github_token: ${{ steps.app-token.outputs.token }}
                  trigger_phrase: "@claude"
                  use_vertex: "true"
                  claude_args: '--model claude-sonnet-4-5@20250929 --max-turns 10'
                env:
                  ANTHROPIC_VERTEX_PROJECT_ID: ${{ steps.auth.outputs.project_id }}
                  CLOUD_ML_REGION: us-east5
                  VERTEX_REGION_CLAUDE_4_5_SONNET: us-east5
        ```

        <Tip>
          The project ID is automatically retrieved from the Google Cloud authentication step, so you don't need to hardcode it.
        </Tip>
      </Accordion>
    </AccordionGroup>
  </Step>
</Steps>

## Troubleshooting

### Claude not responding to @claude commands

Verify the GitHub App is installed correctly, check that workflows are enabled, ensure API key is set in repository secrets, and confirm the comment contains `@claude` (not `/claude`).

### CI not running on Claude's commits

Ensure you're using the GitHub App or custom app (not Actions user), check workflow triggers include the necessary events, and verify app permissions include CI triggers.

### Authentication errors

Confirm API key is valid and has sufficient permissions. For Bedrock/Vertex, check credentials configuration and ensure secrets are named correctly in workflows.

## Advanced configuration

### Action parameters

The Claude Code Action v1 uses a simplified configuration:

| Parameter             | Description                                                        | Required |
| --------------------- | ------------------------------------------------------------------ | -------- |
| `prompt`              | Instructions for Claude (plain text or a [skill](/docs/en/skills) name) | No\*     |
| `claude_args`         | CLI arguments passed to Claude Code                                | No       |
| `plugin_marketplaces` | Newline-separated list of plugin marketplace Git URLs              | No       |
| `plugins`             | Newline-separated list of plugin names to install before execution | No       |
| `anthropic_api_key`   | Claude API key                                                     | Yes\*\*  |
| `github_token`        | GitHub token for API access                                        | No       |
| `trigger_phrase`      | Custom trigger phrase (default: "@claude")                         | No       |
| `use_bedrock`         | Use Amazon Bedrock instead of Claude API                           | No       |
| `use_vertex`          | Use Google Vertex AI instead of Claude API                         | No       |

\*Prompt is optional - when omitted for issue/PR comments, Claude responds to trigger phrase\
\*\*Required for direct Claude API, not for Bedrock/Vertex

#### Pass CLI arguments

The `claude_args` parameter accepts any Claude Code CLI arguments:

```yaml theme={null}
claude_args: "--max-turns 5 --model claude-sonnet-4-6 --mcp-config /path/to/config.json"
```

Common arguments:

* `--max-turns`: Maximum conversation turns (default: 10)
* `--model`: Model to use (for example, `claude-sonnet-4-6`)
* `--mcp-config`: Path to MCP configuration
* `--allowedTools`: Comma-separated list of allowed tools. The `--allowed-tools` alias also works.
* `--debug`: Enable debug output

### Alternative integration methods

While the `/install-github-app` command is the recommended approach, you can also:

* **Custom GitHub App**: For organizations needing branded usernames or custom authentication flows. Create your own GitHub App with required permissions (contents, issues, pull requests) and use the actions/create-github-app-token action to generate tokens in your workflows.
* **Manual GitHub Actions**: Direct workflow configuration for maximum flexibility
* **MCP Configuration**: Dynamic loading of Model Context Protocol servers

See the [Claude Code Action documentation](https://github.com/anthropics/claude-code-action/blob/main/docs) for detailed guides on authentication, security, and advanced configuration.

### Customizing Claude's behavior

You can configure Claude's behavior in two ways:

1. **CLAUDE.md**: Define coding standards, review criteria, and project-specific rules in a `CLAUDE.md` file at the root of your repository. Claude will follow these guidelines when creating PRs and responding to requests. Check out our [Memory documentation](/docs/en/memory) for more details.
2. **Custom prompts**: Use the `prompt` parameter in the workflow file to provide workflow-specific instructions. This allows you to customize Claude's behavior for different workflows or tasks.

Claude will follow these guidelines when creating PRs and responding to requests.


---

## Claude Code with GitHub Enterprise Server

`https://code.claude.com/docs/en/github-enterprise-server`

Connect Claude Code to your self-hosted GitHub Enterprise Server instance for web sessions, code review, and plugin marketplaces.

<Note>
  GitHub Enterprise Server support is available for Team and Enterprise plans.
</Note>

GitHub Enterprise Server (GHES) support lets your organization use Claude Code with repositories hosted on your self-managed GitHub instance instead of github.com. Once an admin connects your GHES instance, developers can run web sessions, get automated code reviews, and install plugins from internal marketplaces without any per-repository configuration.

For repositories on github.com, see [Claude Code on the web](/docs/en/claude-code-on-the-web) and [Code Review](/docs/en/code-review). To run Claude in your own CI infrastructure, see [GitHub Actions](/docs/en/github-actions).

## What works with GitHub Enterprise Server

The table below shows which Claude Code features support GHES and any differences from github.com behavior.

| Feature                | GHES support    | Notes                                                                                                                        |
| :--------------------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Claude Code on the web | ✅ Supported     | Admin connects the GHES instance once; developers use `claude --remote` or [claude.ai/code](https://claude.ai/code) as usual |
| Code Review            | ✅ Supported     | Same automated PR reviews as github.com                                                                                      |
| Claude Security        | ✅ Supported     | Available in public beta for Enterprise plans at [claude.ai/security](https://claude.ai/security)                            |
| Teleport sessions      | ✅ Supported     | Move sessions between web and terminal with `--teleport`                                                                     |
| Plugin marketplaces    | ✅ Supported     | Use full git URLs instead of `owner/repo` shorthand                                                                          |
| Contribution metrics   | ✅ Supported     | Delivered via webhooks to the [analytics dashboard](/docs/en/analytics)                                                           |
| GitHub Actions         | ✅ Supported     | Requires manual workflow setup; `/install-github-app` is github.com only                                                     |
| GitHub MCP server      | ❌ Not supported | The GitHub MCP server does not work with GHES instances                                                                      |

## Admin setup

An admin connects your GHES instance to Claude Code once. After that, developers in your organization can use GHES repositories without any additional configuration. You need admin access to your Claude organization and permission to create GitHub Apps on your GHES instance.

The guided setup generates a GitHub App manifest and redirects you to your GHES instance to create the app in one click. If your environment blocks the redirect flow, an [alternative manual setup](#manual-setup) is available.

<Steps>
  <Step title="Open Claude Code admin settings">
    Go to [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) and find the GitHub Enterprise Server section.
  </Step>

  <Step title="Start the guided setup">
    Click **Connect**. Enter a display name for the connection and your GHES hostname, for example `github.example.com`. If your GHES instance uses a self-signed or private certificate authority, paste the CA certificate in the optional field.
  </Step>

  <Step title="Create the GitHub App">
    Click **Continue to GitHub Enterprise**. Your browser redirects to your GHES instance with a pre-filled app manifest. Review the configuration and click **Create GitHub App**. GHES redirects you back to Claude with the app credentials stored automatically.
  </Step>

  <Step title="Install the app on your repositories">
    From the GitHub App page on your GHES instance, install the app on the repositories or organizations you want Claude to access. You can start with a subset and add more later.
  </Step>

  <Step title="Enable features">
    Return to [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) and enable [Code Review](/docs/en/code-review#set-up-code-review), Claude Security, and [contribution metrics](/docs/en/analytics#enable-contribution-metrics) for your GHES repositories using the same configuration as github.com.
  </Step>
</Steps>

### GitHub App permissions

The manifest configures the GitHub App with the permissions and webhook events Claude needs across web sessions, Code Review, Claude Security, and contribution metrics:

| Permission       | Access         | Used for                                    |
| :--------------- | :------------- | :------------------------------------------ |
| Contents         | Read and write | Cloning repositories and pushing branches   |
| Pull requests    | Read and write | Creating PRs and posting review comments    |
| Issues           | Read and write | Responding to issue mentions                |
| Checks           | Read and write | Posting Code Review check runs              |
| Actions          | Read           | Reading CI status for auto-fix              |
| Repository hooks | Read and write | Receiving webhooks for contribution metrics |
| Metadata         | Read           | Required by GitHub for all apps             |

The app subscribes to `pull_request`, `issue_comment`, `pull_request_review_comment`, `pull_request_review`, and `check_run` events.

### Manual setup

If the guided redirect flow is blocked by your network configuration, click **Add manually** instead of Connect. Create a GitHub App on your GHES instance with the [permissions and events above](#github-app-permissions), then enter the app credentials in the form: hostname, OAuth client ID and secret, GitHub App ID, client ID, client secret, webhook secret, and private key.

### Network requirements

Your GHES instance must be reachable from Anthropic infrastructure so Claude can clone repositories and post review comments. If your GHES instance is behind a firewall, allowlist the [Anthropic API IP addresses](https://platform.claude.com/docs/en/api/ip-addresses).

## Developer workflow

Once your admin has connected the GHES instance, no developer-side configuration is needed. Claude Code detects your GHES hostname automatically from the git remote in your working directory.

Clone a repository from your GHES instance as you normally would:

```bash theme={null}
git clone git@github.example.com:platform/api-service.git
cd api-service
```

Then start a web session. Claude detects the GHES host from your git remote and routes the session through your organization's configured instance:

```bash theme={null}
claude --remote "Add retry logic to the payment webhook handler"
```

The session runs on Anthropic infrastructure, clones your repository from GHES, and pushes changes back to a branch. Monitor progress with `/tasks` or at [claude.ai/code](https://claude.ai/code). See [Claude Code on the web](/docs/en/claude-code-on-the-web) for the full remote session workflow including diff review, auto-fix, and routines.

### Teleport sessions to your terminal

Pull a web session into your local terminal with `claude --teleport`. Teleport verifies you're in a checkout of the same GHES repository before fetching the branch and loading the session history. See [teleport requirements](/docs/en/claude-code-on-the-web#teleport-requirements) for details.

## Plugin marketplaces on GHES

Host plugin marketplaces on your GHES instance to distribute internal tooling across your organization. The marketplace structure is identical to github.com-hosted marketplaces; the only difference is how you reference them.

### Add a GHES marketplace

The `owner/repo` shorthand always resolves to github.com. For GHES-hosted marketplaces, use the full git URL:

```bash theme={null}
/plugin marketplace add git@github.example.com:platform/claude-plugins.git
```

HTTPS URLs work as well:

```bash theme={null}
/plugin marketplace add https://github.example.com/platform/claude-plugins.git
```

See [Create and distribute a plugin marketplace](/docs/en/plugin-marketplaces) for the full guide to building marketplaces.

### Allowlist GHES marketplaces in managed settings

If your organization uses [managed settings](/docs/en/settings) to restrict which marketplaces developers can add, use the `hostPattern` source type to allow all marketplaces from your GHES instance without enumerating each repository:

```json theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "hostPattern",
      "hostPattern": "^github\\.example\\.com$"
    }
  ]
}
```

You can also pre-register marketplaces for developers so they appear without manual setup. This example makes an internal tools marketplace available organization-wide:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "internal-tools": {
      "source": {
        "source": "git",
        "url": "git@github.example.com:platform/claude-plugins.git"
      }
    }
  }
}
```

See the [strictKnownMarketplaces](/docs/en/settings#strictknownmarketplaces) and [extraKnownMarketplaces](/docs/en/settings#extraknownmarketplaces) settings reference for the complete schema.

## Limitations

A few features behave differently on GHES than on github.com. The [feature table](#what-works-with-github-enterprise-server) summarizes support; this section covers the workarounds.

* **`/install-github-app` command**: follow the [admin setup](#admin-setup) flow on claude.ai instead. If you also want GitHub Actions workflows on GHES, adapt the [example workflow](https://github.com/anthropics/claude-code-action/blob/main/examples/claude.yml) manually.
* **GitHub MCP server**: use the `gh` CLI configured for your GHES host instead. Run `gh auth login --hostname github.example.com` to authenticate, then Claude can use `gh` commands in sessions.

## Troubleshooting

### Web session fails to clone repository

If `claude --remote` fails with a clone error, verify that your admin has completed setup for your GHES instance and that the GitHub App is installed on the repository you're working in. Check with your admin that the instance hostname registered in Claude settings matches the hostname in your git remote.

### Marketplace add fails with a policy error

If `/plugin marketplace add` is blocked for your GHES URL, your organization has restricted marketplace sources. Ask your admin to add a `hostPattern` entry for your GHES hostname in [managed settings](#allowlist-ghes-marketplaces-in-managed-settings).

### GHES instance not reachable

If reviews or web sessions time out, your GHES instance may not be reachable from Anthropic infrastructure. Confirm your firewall allows inbound connections from the [Anthropic API IP addresses](https://platform.claude.com/docs/en/api/ip-addresses).

## Related resources

These pages cover the features referenced throughout this guide in more depth:

* [Claude Code on the web](/docs/en/claude-code-on-the-web): run Claude Code sessions on cloud infrastructure
* [Code Review](/docs/en/code-review): automated PR reviews
* [Plugin marketplaces](/docs/en/plugin-marketplaces): build and distribute plugin catalogs
* [Analytics](/docs/en/analytics): track usage and contribution metrics
* [Managed settings](/docs/en/settings): organization-wide policy configuration
* [Network configuration](/docs/en/network-config): firewall and IP allowlist requirements


---

## Claude Code GitLab CI/CD

`https://code.claude.com/docs/en/gitlab-ci-cd`

Learn about integrating Claude Code into your development workflow with GitLab CI/CD

<Info>
  Claude Code for GitLab CI/CD is currently in beta. Features and functionality may evolve as we refine the experience.

  This integration is maintained by GitLab. For support, see the following [GitLab issue](https://gitlab.com/gitlab-org/gitlab/-/issues/573776).
</Info>

<Note>
  This integration is built on top of the [Claude Code CLI and Agent SDK](/docs/en/agent-sdk/overview), enabling programmatic use of Claude in your CI/CD jobs and custom automation workflows.
</Note>

## Why use Claude Code with GitLab?

* **Instant MR creation**: Describe what you need, and Claude proposes a complete MR with changes and explanation
* **Automated implementation**: Turn issues into working code with a single command or mention
* **Project-aware**: Claude follows your `CLAUDE.md` guidelines and existing code patterns
* **Simple setup**: Add one job to `.gitlab-ci.yml` and a masked CI/CD variable
* **Enterprise-ready**: Choose Claude API, Amazon Bedrock, or Google Vertex AI to meet data residency and procurement needs
* **Secure by default**: Runs in your GitLab runners with your branch protection and approvals

## How it works

Claude Code uses GitLab CI/CD to run AI tasks in isolated jobs and commit results back via MRs:

1. **Event-driven orchestration**: GitLab listens for your chosen triggers (for example, a comment that mentions `@claude` in an issue, MR, or review thread). The job collects context from the thread and repository, builds prompts from that input, and runs Claude Code.

2. **Provider abstraction**: Use the provider that fits your environment:
   * Claude API (SaaS)
   * Amazon Bedrock (IAM-based access, cross-region options)
   * Google Vertex AI (GCP-native, Workload Identity Federation)

3. **Sandboxed execution**: Each interaction runs in a container with strict network and filesystem rules. Claude Code enforces workspace-scoped permissions to constrain writes. Every change flows through an MR so reviewers see the diff and approvals still apply.

Pick regional endpoints to reduce latency and meet data-sovereignty requirements while using existing cloud agreements.

## What can Claude do?

Claude Code enables powerful CI/CD workflows that transform how you work with code:

* Create and update MRs from issue descriptions or comments
* Analyze performance regressions and propose optimizations
* Implement features directly in a branch, then open an MR
* Fix bugs and regressions identified by tests or comments
* Respond to follow-up comments to iterate on requested changes

## Setup

### Quick setup

The fastest way to get started is to add a minimal job to your `.gitlab-ci.yml` and set your API key as a masked variable.

1. **Add a masked CI/CD variable**
   * Go to **Settings** → **CI/CD** → **Variables**
   * Add `ANTHROPIC_API_KEY` (masked, protected as needed)

2. **Add a Claude job to `.gitlab-ci.yml`**

```yaml theme={null}
stages:
  - ai

claude:
  stage: ai
  image: node:24-alpine3.21
  # Adjust rules to fit how you want to trigger the job:
  # - manual runs
  # - merge request events
  # - web/API triggers when a comment contains '@claude'
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    # Optional: start a GitLab MCP server if your setup provides one
    - /bin/gitlab-mcp-server || true
    # Use AI_FLOW_* variables when invoking via web/API triggers with context payloads
    - echo "$AI_FLOW_INPUT for $AI_FLOW_CONTEXT on $AI_FLOW_EVENT"
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Review this MR and implement the requested changes'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
```

After adding the job and your `ANTHROPIC_API_KEY` variable, test by running the job manually from **CI/CD** → **Pipelines**, or trigger it from an MR to let Claude propose updates in a branch and open an MR if needed.

<Note>
  To run on Amazon Bedrock or Google Vertex AI instead of the Claude API, see the [Using with Amazon Bedrock & Google Vertex AI](#using-with-amazon-bedrock--google-vertex-ai) section below for authentication and environment setup.
</Note>

### Manual setup (recommended for production)

If you prefer a more controlled setup or need enterprise providers:

1. **Configure provider access**:
   * **Claude API**: Create and store `ANTHROPIC_API_KEY` as a masked CI/CD variable
   * **Amazon Bedrock**: **Configure GitLab** → **AWS OIDC** and create an IAM role for Bedrock
   * **Google Vertex AI**: **Configure Workload Identity Federation for GitLab** → **GCP**

2. **Add project credentials for GitLab API operations**:
   * Use `CI_JOB_TOKEN` by default, or create a Project Access Token with `api` scope
   * Store as `GITLAB_ACCESS_TOKEN` (masked) if using a PAT

3. **Add the Claude job to `.gitlab-ci.yml`** (see examples below)

4. **(Optional) Enable mention-driven triggers**:
   * Add a project webhook for "Comments (notes)" to your event listener (if you use one)
   * Have the listener call the pipeline trigger API with variables like `AI_FLOW_INPUT` and `AI_FLOW_CONTEXT` when a comment contains `@claude`

## Example use cases

### Turn issues into MRs

In an issue comment:

```text theme={null}
@claude implement this feature based on the issue description
```

Claude analyzes the issue and codebase, writes changes in a branch, and opens an MR for review.

### Get implementation help

In an MR discussion:

```text theme={null}
@claude suggest a concrete approach to cache the results of this API call
```

Claude proposes changes, adds code with appropriate caching, and updates the MR.

### Fix bugs quickly

In an issue or MR comment:

```text theme={null}
@claude fix the TypeError in the user dashboard component
```

Claude locates the bug, implements a fix, and updates the branch or opens a new MR.

## Using with Amazon Bedrock & Google Vertex AI

For enterprise environments, you can run Claude Code entirely on your cloud infrastructure with the same developer experience.

<Tabs>
  <Tab title="Amazon Bedrock">
    ### Prerequisites

    Before setting up Claude Code with Amazon Bedrock, you need:

    1. An AWS account with Amazon Bedrock access to the desired Claude models
    2. GitLab configured as an OIDC identity provider in AWS IAM
    3. An IAM role with Bedrock permissions and a trust policy restricted to your GitLab project/refs
    4. GitLab CI/CD variables for role assumption:
       * `AWS_ROLE_TO_ASSUME` (role ARN)
       * `AWS_REGION` (Bedrock region)

    ### Setup instructions

    Configure AWS to allow GitLab CI jobs to assume an IAM role via OIDC (no static keys).

    **Required setup:**

    1. Enable Amazon Bedrock and request access to your target Claude models
    2. Create an IAM OIDC provider for GitLab if not already present
    3. Create an IAM role trusted by the GitLab OIDC provider, restricted to your project and protected refs
    4. Attach least-privilege permissions for Bedrock invoke APIs

    **Required values to store in CI/CD variables:**

    * `AWS_ROLE_TO_ASSUME`
    * `AWS_REGION`

    Add variables in Settings → CI/CD → Variables:

    ```yaml theme={null}
    # For Amazon Bedrock:
    - AWS_ROLE_TO_ASSUME
    - AWS_REGION
    ```

    Use the Amazon Bedrock job example above to exchange the GitLab job token for temporary AWS credentials at runtime.
  </Tab>

  <Tab title="Google Vertex AI">
    ### Prerequisites

    Before setting up Claude Code with Google Vertex AI, you need:

    1. A Google Cloud project with:
       * Vertex AI API enabled
       * Workload Identity Federation configured to trust GitLab OIDC
    2. A dedicated service account with only the required Vertex AI roles
    3. GitLab CI/CD variables for WIF:
       * `GCP_WORKLOAD_IDENTITY_PROVIDER` (full resource name)
       * `GCP_SERVICE_ACCOUNT` (service account email)

    ### Setup instructions

    Configure Google Cloud to allow GitLab CI jobs to impersonate a service account via Workload Identity Federation.

    **Required setup:**

    1. Enable IAM Credentials API, STS API, and Vertex AI API
    2. Create a Workload Identity Pool and provider for GitLab OIDC
    3. Create a dedicated service account with Vertex AI roles
    4. Grant the WIF principal permission to impersonate the service account

    **Required values to store in CI/CD variables:**

    * `GCP_WORKLOAD_IDENTITY_PROVIDER`
    * `GCP_SERVICE_ACCOUNT`

    Add variables in Settings → CI/CD → Variables:

    ```yaml theme={null}
    # For Google Vertex AI:
    - GCP_WORKLOAD_IDENTITY_PROVIDER
    - GCP_SERVICE_ACCOUNT
    - CLOUD_ML_REGION (for example, us-east5)
    ```

    Use the Google Vertex AI job example above to authenticate without storing keys.
  </Tab>
</Tabs>

## Configuration examples

Below are ready-to-use snippets you can adapt to your pipeline.

### Basic .gitlab-ci.yml (Claude API)

```yaml theme={null}
stages:
  - ai

claude:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    GIT_STRATEGY: fetch
  before_script:
    - apk update
    - apk add --no-cache git curl bash
    - curl -fsSL https://claude.ai/install.sh | bash
  script:
    - /bin/gitlab-mcp-server || true
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Summarize recent changes and suggest improvements'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
  # Claude Code will use ANTHROPIC_API_KEY from CI/CD variables
```

### Amazon Bedrock job example (OIDC)

**Prerequisites:**

* Amazon Bedrock enabled with access to your chosen Claude model(s)
* GitLab OIDC configured in AWS with a role that trusts your GitLab project and refs
* IAM role with Bedrock permissions (least privilege recommended)

**Required CI/CD variables:**

* `AWS_ROLE_TO_ASSUME`: ARN of the IAM role for Bedrock access
* `AWS_REGION`: Bedrock region (for example, `us-west-2`)

```yaml theme={null}
claude-bedrock:
  stage: ai
  image: node:24-alpine3.21
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
  before_script:
    - apk add --no-cache bash curl jq git python3 py3-pip
    - pip install --no-cache-dir awscli
    - curl -fsSL https://claude.ai/install.sh | bash
    # Exchange GitLab OIDC token for AWS credentials
    - export AWS_WEB_IDENTITY_TOKEN_FILE="${CI_JOB_JWT_FILE:-/tmp/oidc_token}"
    - if [ -n "${CI_JOB_JWT_V2}" ]; then printf "%s" "$CI_JOB_JWT_V2" > "$AWS_WEB_IDENTITY_TOKEN_FILE"; fi
    - >
      aws sts assume-role-with-web-identity
      --role-arn "$AWS_ROLE_TO_ASSUME"
      --role-session-name "gitlab-claude-$(date +%s)"
      --web-identity-token "file://$AWS_WEB_IDENTITY_TOKEN_FILE"
      --duration-seconds 3600 > /tmp/aws_creds.json
    - export AWS_ACCESS_KEY_ID="$(jq -r .Credentials.AccessKeyId /tmp/aws_creds.json)"
    - export AWS_SECRET_ACCESS_KEY="$(jq -r .Credentials.SecretAccessKey /tmp/aws_creds.json)"
    - export AWS_SESSION_TOKEN="$(jq -r .Credentials.SessionToken /tmp/aws_creds.json)"
  script:
    - /bin/gitlab-mcp-server || true
    - >
      claude
      -p "${AI_FLOW_INPUT:-'Implement the requested changes and open an MR'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
  variables:
    AWS_REGION: "us-west-2"
```

<Note>
  Model IDs for Bedrock include region-specific prefixes (for example, `us.anthropic.claude-sonnet-4-6`). Pass the desired model via your job configuration or prompt if your workflow supports it.
</Note>

### Google Vertex AI job example (Workload Identity Federation)

**Prerequisites:**

* Vertex AI API enabled in your GCP project
* Workload Identity Federation configured to trust GitLab OIDC
* A service account with Vertex AI permissions

**Required CI/CD variables:**

* `GCP_WORKLOAD_IDENTITY_PROVIDER`: Full provider resource name
* `GCP_SERVICE_ACCOUNT`: Service account email
* `CLOUD_ML_REGION`: Vertex region (for example, `us-east5`)

```yaml theme={null}
claude-vertex:
  stage: ai
  image: gcr.io/google.com/cloudsdktool/google-cloud-cli:slim
  rules:
    - if: '$CI_PIPELINE_SOURCE == "web"'
  before_script:
    - apt-get update && apt-get install -y git && apt-get clean
    - curl -fsSL https://claude.ai/install.sh | bash
    # Authenticate to Google Cloud via WIF (no downloaded keys)
    - >
      gcloud auth login --cred-file=<(cat <<EOF
      {
        "type": "external_account",
        "audience": "${GCP_WORKLOAD_IDENTITY_PROVIDER}",
        "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
        "service_account_impersonation_url": "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT}:generateAccessToken",
        "token_url": "https://sts.googleapis.com/v1/token"
      }
      EOF
      )
    - gcloud config set project "$(gcloud projects list --format='value(projectId)' --filter="name:${CI_PROJECT_NAMESPACE}" | head -n1)" || true
  script:
    - /bin/gitlab-mcp-server || true
    - >
      CLOUD_ML_REGION="${CLOUD_ML_REGION:-us-east5}"
      claude
      -p "${AI_FLOW_INPUT:-'Review and update code as requested'}"
      --permission-mode acceptEdits
      --allowedTools "Bash Read Edit Write mcp__gitlab"
      --debug
  variables:
    CLOUD_ML_REGION: "us-east5"
```

<Note>
  With Workload Identity Federation, you do not need to store service account keys. Use repository-specific trust conditions and least-privilege service accounts.
</Note>

## Best practices

### CLAUDE.md configuration

Create a `CLAUDE.md` file at the repository root to define coding standards, review criteria, and project-specific rules. Claude reads this file during runs and follows your conventions when proposing changes.

### Security considerations

**Never commit API keys or cloud credentials to your repository**. Always use GitLab CI/CD variables:

* Add `ANTHROPIC_API_KEY` as a masked variable (and protect it if needed)
* Use provider-specific OIDC where possible (no long-lived keys)
* Limit job permissions and network egress
* Review Claude's MRs like any other contributor

### Optimizing performance

* Keep `CLAUDE.md` focused and concise
* Provide clear issue/MR descriptions to reduce iterations
* Configure sensible job timeouts to avoid runaway runs
* Cache npm and package installs in runners where possible

### CI costs

When using Claude Code with GitLab CI/CD, be aware of associated costs:

* **GitLab Runner time**:
  * Claude runs on your GitLab runners and consumes compute minutes
  * See your GitLab plan's runner billing for details

* **API costs**:
  * Each Claude interaction consumes tokens based on prompt and response size
  * Token usage varies by task complexity and codebase size
  * See [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) for details

* **Cost optimization tips**:
  * Use specific `@claude` commands to reduce unnecessary turns
  * Set appropriate `max_turns` and job timeout values
  * Limit concurrency to control parallel runs

## Security and governance

* Each job runs in an isolated container with restricted network access
* Claude's changes flow through MRs so reviewers see every diff
* Branch protection and approval rules apply to AI-generated code
* Claude Code uses workspace-scoped permissions to constrain writes
* Costs remain under your control because you bring your own provider credentials

## Troubleshooting

### Claude not responding to @claude commands

* Verify your pipeline is being triggered (manually, MR event, or via a note event listener/webhook)
* Ensure CI/CD variables (`ANTHROPIC_API_KEY` or cloud provider settings) are present and unmasked
* Check that the comment contains `@claude` (not `/claude`) and that your mention trigger is configured

### Job can't write comments or open MRs

* Ensure `CI_JOB_TOKEN` has sufficient permissions for the project, or use a Project Access Token with `api` scope
* Check the `mcp__gitlab` tool is enabled in `--allowedTools`
* Confirm the job runs in the context of the MR or has enough context via `AI_FLOW_*` variables

### Authentication errors

* **For Claude API**: Confirm `ANTHROPIC_API_KEY` is valid and unexpired
* **For Bedrock/Vertex**: Verify OIDC/WIF configuration, role impersonation, and secret names; confirm region and model availability

## Advanced configuration

### Common parameters and variables

Claude Code supports these commonly used inputs:

* `prompt` / `prompt_file`: Provide instructions inline (`-p`) or via a file
* `max_turns`: Limit the number of back-and-forth iterations
* `timeout_minutes`: Limit total execution time
* `ANTHROPIC_API_KEY`: Required for the Claude API (not used for Bedrock/Vertex)
* Provider-specific environment: `AWS_REGION`, project/region vars for Vertex

<Note>
  Exact flags and parameters may vary by version of `@anthropic-ai/claude-code`. Run `claude --help` in your job to see supported options.
</Note>

### Customizing Claude's behavior

You can guide Claude in two primary ways:

1. **CLAUDE.md**: Define coding standards, security requirements, and project conventions. Claude reads this during runs and follows your rules.
2. **Custom prompts**: Pass task-specific instructions via `prompt`/`prompt_file` in the job. Use different prompts for different jobs (for example, review, implement, refactor).


---

## Run Claude Code programmatically

`https://code.claude.com/docs/en/headless`

Use the Agent SDK to run Claude Code programmatically from the CLI, Python, or TypeScript.

<Note>
  Starting June 15, 2026, Agent SDK and `claude -p` usage on subscription plans will draw from a new monthly Agent SDK credit, separate from your interactive usage limits. See [Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) for details.
</Note>

The [Agent SDK](/docs/en/agent-sdk/overview) gives you the same tools, agent loop, and context management that power Claude Code. It's available as a CLI for scripts and CI/CD, or as [Python](/docs/en/agent-sdk/python) and [TypeScript](/docs/en/agent-sdk/typescript) packages for full programmatic control.

To run Claude Code in non-interactive mode, pass `-p` with your prompt and any [CLI options](/docs/en/cli-reference):

```bash theme={null}
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
```

This page covers using the Agent SDK via the CLI (`claude -p`). For the Python and TypeScript SDK packages with structured outputs, tool approval callbacks, and native message objects, see the [full Agent SDK documentation](/docs/en/agent-sdk/overview).

## Basic usage

Add the `-p` (or `--print`) flag to any `claude` command to run it non-interactively. All [CLI options](/docs/en/cli-reference) work with `-p`, including:

* `--continue` for [continuing conversations](#continue-conversations)
* `--allowedTools` for [auto-approving tools](#auto-approve-tools)
* `--output-format` for [structured output](#get-structured-output)

This example asks Claude a question about your codebase and prints the response:

```bash theme={null}
claude -p "What does the auth module do?"
```

### Start faster with bare mode

Add `--bare` to reduce startup time by skipping auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md. Without it, `claude -p` loads the same [context](/docs/en/how-claude-code-works#the-context-window) an interactive session would, including anything configured in the working directory or `~/.claude`.

Bare mode is useful for CI and scripts where you need the same result on every machine. A hook in a teammate's `~/.claude` or an MCP server in the project's `.mcp.json` won't run, because bare mode never reads them. Only flags you pass explicitly take effect.

This example runs a one-off summarize task in bare mode and pre-approves the Read tool so the call completes without a permission prompt:

```bash theme={null}
claude --bare -p "Summarize this file" --allowedTools "Read"
```

In bare mode Claude has access to the Bash, file read, and file edit tools. Pass any context you need with a flag:

| To load                 | Use                                                     |
| ----------------------- | ------------------------------------------------------- |
| System prompt additions | `--append-system-prompt`, `--append-system-prompt-file` |
| Settings                | `--settings <file-or-json>`                             |
| MCP servers             | `--mcp-config <file-or-json>`                           |
| Custom agents           | `--agents <json>`                                       |
| A plugin                | `--plugin-dir <path>`, `--plugin-url <url>`             |

Bare mode skips OAuth and keychain reads. Anthropic authentication must come from `ANTHROPIC_API_KEY` or an `apiKeyHelper` in the JSON passed to `--settings`. Bedrock, Vertex, and Foundry use their usual provider credentials.

<Note>
  `--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release.
</Note>

## Examples

These examples highlight common CLI patterns. For CI and other scripted calls, add [`--bare`](#start-faster-with-bare-mode) so they don't pick up whatever happens to be configured locally.

### Pipe data through Claude

Non-interactive mode reads stdin, so you can pipe data in and redirect the response out like any other command-line tool.

This example pipes a build log into Claude and writes the explanation to a file:

```bash theme={null}
cat build-error.txt | claude -p 'concisely explain the root cause of this build error' > output.txt
```

With `--output-format json`, the response payload includes `total_cost_usd` and a per-model cost breakdown, so scripted callers can track spend per invocation without consulting the [usage dashboard](/docs/en/costs).

<Note>
  As of Claude Code v2.1.128, piped stdin is capped at 10MB. If you exceed the cap, Claude Code exits with a clear error and a non-zero status. To work with larger inputs, write the content to a file and reference the file path in your prompt instead of piping it.
</Note>

### Add Claude to a build script

You can wrap a non-interactive call in a script to use Claude as a project-specific linter or reviewer.

This `package.json` script pipes the diff against `main` into Claude and asks it to report typos. Piping the diff means Claude doesn't need Bash permission to read it, and the escaped double quotes keep the script portable to Windows:

```json theme={null}
{
  "scripts": {
    "lint:claude": "git diff main | claude -p \"you are a typo linter. for each typo in this diff, report filename:line on one line and the issue on the next. return nothing else.\""
  }
}
```

### Get structured output

Use `--output-format` to control how responses are returned:

* `text` (default): plain text output
* `json`: structured JSON with result, session ID, and metadata
* `stream-json`: newline-delimited JSON for real-time streaming

This example returns a project summary as JSON with session metadata, with the text result in the `result` field:

```bash theme={null}
claude -p "Summarize this project" --output-format json
```

To get output conforming to a specific schema, use `--output-format json` with `--json-schema` and a [JSON Schema](https://json-schema.org/) definition. The response includes metadata about the request (session ID, usage, etc.) with the structured output in the `structured_output` field.

This example extracts function names and returns them as an array of strings:

```bash theme={null}
claude -p "Extract the main function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

<Tip>
  Use a tool like [jq](https://jqlang.github.io/jq/) to parse the response and extract specific fields:

  ```bash theme={null}
  # Extract the text result
  claude -p "Summarize this project" --output-format json | jq -r '.result'

  # Extract structured output
  claude -p "Extract function names from auth.py" \
    --output-format json \
    --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}' \
    | jq '.structured_output'
  ```
</Tip>

### Stream responses

Use `--output-format stream-json` with `--verbose` and `--include-partial-messages` to receive tokens as they're generated. Each line is a JSON object representing an event:

```bash theme={null}
claude -p "Explain recursion" --output-format stream-json --verbose --include-partial-messages
```

The following example uses [jq](https://jqlang.github.io/jq/) to filter for text deltas and display just the streaming text. The `-r` flag outputs raw strings (no quotes) and `-j` joins without newlines so tokens stream continuously:

```bash theme={null}
claude -p "Write a poem" --output-format stream-json --verbose --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

When an API request fails with a retryable error, Claude Code emits a `system/api_retry` event before retrying. You can use this to surface retry progress or implement custom backoff logic.

| Field            | Type            | Description                                                                                                                                                                              |
| ---------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `"system"`      | message type                                                                                                                                                                             |
| `subtype`        | `"api_retry"`   | identifies this as a retry event                                                                                                                                                         |
| `attempt`        | integer         | current attempt number, starting at 1                                                                                                                                                    |
| `max_retries`    | integer         | total retries permitted                                                                                                                                                                  |
| `retry_delay_ms` | integer         | milliseconds until the next attempt                                                                                                                                                      |
| `error_status`   | integer or null | HTTP status code, or `null` for connection errors with no HTTP response                                                                                                                  |
| `error`          | string          | error category: `authentication_failed`, `oauth_org_not_allowed`, `billing_error`, `rate_limit`, `invalid_request`, `model_not_found`, `server_error`, `max_output_tokens`, or `unknown` |
| `uuid`           | string          | unique event identifier                                                                                                                                                                  |
| `session_id`     | string          | session the event belongs to                                                                                                                                                             |

The `system/init` event reports session metadata including the model, tools, MCP servers, and loaded plugins. It is the first event in the stream unless [`CLAUDE_CODE_SYNC_PLUGIN_INSTALL`](/docs/en/env-vars) is set, in which case `plugin_install` events precede it. Use the plugin fields to fail CI when a plugin did not load:

| Field           | Type  | Description                                                                                                                                                                                                                                                                                  |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins`       | array | plugins that loaded successfully, each with `name` and `path`                                                                                                                                                                                                                                |
| `plugin_errors` | array | plugin load-time errors, each with `plugin`, `type`, and `message`. Includes unsatisfied dependency versions and `--plugin-dir` load failures such as a missing path or invalid archive. Affected plugins are demoted and absent from `plugins`. The key is omitted when there are no errors |

When [`CLAUDE_CODE_SYNC_PLUGIN_INSTALL`](/docs/en/env-vars) is set, Claude Code emits `system/plugin_install` events while marketplace plugins install before the first turn. Use these to surface install progress in your own UI.

| Field        | Type                                                     | Description                                                                                                    |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `type`       | `"system"`                                               | message type                                                                                                   |
| `subtype`    | `"plugin_install"`                                       | identifies this as a plugin install event                                                                      |
| `status`     | `"started"`, `"installed"`, `"failed"`, or `"completed"` | `started` and `completed` bracket the overall install; `installed` and `failed` report individual marketplaces |
| `name`       | string, optional                                         | marketplace name, present on `installed` and `failed`                                                          |
| `error`      | string, optional                                         | failure message, present on `failed`                                                                           |
| `uuid`       | string                                                   | unique event identifier                                                                                        |
| `session_id` | string                                                   | session the event belongs to                                                                                   |

For programmatic streaming with callbacks and message objects, see [Stream responses in real-time](/docs/en/agent-sdk/streaming-output) in the Agent SDK documentation.

### Auto-approve tools

Use `--allowedTools` to let Claude use certain tools without prompting. This example runs a test suite and fixes failures, allowing Claude to execute Bash commands and read/edit files without asking for permission:

```bash theme={null}
claude -p "Run the test suite and fix any failures" \
  --allowedTools "Bash,Read,Edit"
```

To set a baseline for the whole session instead of listing individual tools, pass a [permission mode](/docs/en/permission-modes). `dontAsk` denies anything not in your `permissions.allow` rules or the [read-only command set](/docs/en/permissions#read-only-commands), which is useful for locked-down CI runs. `acceptEdits` lets Claude write files without prompting and also auto-approves common filesystem commands such as `mkdir`, `touch`, `mv`, and `cp`. Other shell commands and network requests still need an `--allowedTools` entry or a `permissions.allow` rule, otherwise the run aborts when one is attempted:

```bash theme={null}
claude -p "Apply the lint fixes" --permission-mode acceptEdits
```

### Create a commit

This example reviews staged changes and creates a commit with an appropriate message:

```bash theme={null}
claude -p "Look at my staged changes and create an appropriate commit" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

The `--allowedTools` flag uses [permission rule syntax](/docs/en/settings#permission-rule-syntax). The trailing ` *` enables prefix matching, so `Bash(git diff *)` allows any command starting with `git diff`. The space before `*` is important: without it, `Bash(git diff*)` would also match `git diff-index`.

<Note>
  User-invoked [skills](/docs/en/skills) like `/code-review` and [built-in commands](/docs/en/commands) are only available in interactive mode. In `-p` mode, describe the task you want to accomplish instead.
</Note>

### Customize the system prompt

Use `--append-system-prompt` to add instructions while keeping Claude Code's default behavior. This example pipes a PR diff to Claude and instructs it to review for security vulnerabilities:

```bash theme={null}
gh pr diff "$1" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json
```

See [system prompt flags](/docs/en/cli-reference#system-prompt-flags) for more options including `--system-prompt` to fully replace the default prompt.

### Continue conversations

Use `--continue` to continue the most recent conversation, or `--resume` with a session ID to continue a specific conversation. This example runs a review, then sends follow-up prompts:

```bash theme={null}
# First request
claude -p "Review this codebase for performance issues"

# Continue the most recent conversation
claude -p "Now focus on the database queries" --continue
claude -p "Generate a summary of all issues found" --continue
```

If you're running multiple conversations, capture the session ID to resume a specific one:

```bash theme={null}
session_id=$(claude -p "Start a review" --output-format json | jq -r '.session_id')
claude -p "Continue that review" --resume "$session_id"
```

## Next steps

* [Agent SDK quickstart](/docs/en/agent-sdk/quickstart): build your first agent with Python or TypeScript
* [CLI reference](/docs/en/cli-reference): all CLI flags and options
* [GitHub Actions](/docs/en/github-actions): use the Agent SDK in GitHub workflows
* [GitLab CI/CD](/docs/en/gitlab-ci-cd): use the Agent SDK in GitLab pipelines


---

## Automate work with routines

`https://code.claude.com/docs/en/routines`

Put Claude Code on autopilot. Define routines that run on a schedule, trigger on API calls, or react to GitHub events from Anthropic-managed cloud infrastructure.

<Note>
  Routines are in research preview. Behavior, limits, and the API surface may change.
</Note>

A routine is a saved Claude Code configuration: a prompt, one or more repositories, and a set of [connectors](/docs/en/mcp), packaged once and run automatically. Routines execute on Anthropic-managed cloud infrastructure, so they keep working when your laptop is closed.

Each routine can have one or more triggers attached to it:

* **Scheduled**: run on a recurring cadence like hourly, nightly, or weekly, or once at a specific future time
* **API**: trigger on demand by sending an HTTP POST to a per-routine endpoint with a bearer token
* **GitHub**: run automatically in response to repository events such as pull requests or releases

A single routine can combine triggers. For example, a PR review routine can run nightly, trigger from a deploy script, and also react to every new PR.

Routines are available on Pro, Max, Team, and Enterprise plans with [Claude Code on the web](/docs/en/claude-code-on-the-web) enabled. Create and manage them at [claude.ai/code/routines](https://claude.ai/code/routines), or from the CLI with `/schedule`.

Team and Enterprise admins can disable routines for all members with the Routines toggle at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code). When disabled, existing routines stop running and members cannot create new ones.

This page covers creating a routine, configuring each trigger type, managing runs, and how usage limits apply.

## Example use cases

Each example pairs a trigger type with the kind of work routines are suited to: unattended, repeatable, and tied to a clear outcome.

**Backlog maintenance.** A schedule trigger runs every weeknight against your issue tracker via a connector. The routine reads issues opened since the last run, applies labels, assigns owners based on the area of code referenced, and posts a summary to Slack so the team starts the day with a groomed queue.

**Alert triage.** Your monitoring tool calls the routine's API endpoint when an error threshold is crossed, passing the alert body as `text`. The routine pulls the stack trace, correlates it with recent commits in the repository, and opens a draft pull request with a proposed fix and a link back to the alert. On-call reviews the PR instead of starting from a blank terminal.

**Bespoke code review.** A GitHub trigger runs on `pull_request.opened`. The routine applies your team's own review checklist, leaves inline comments for security, performance, and style issues, and adds a summary comment so human reviewers can focus on design instead of mechanical checks.

**Deploy verification.** Your CD pipeline calls the routine's API endpoint after each production deploy. The routine runs smoke checks against the new build, scans error logs for regressions, and posts a go or no-go to the release channel before the deploy window closes.

**Docs drift.** A schedule trigger runs weekly. The routine scans merged PRs since the last run, flags documentation that references changed APIs, and opens update PRs against the docs repository for an editor to review.

**Library port.** A GitHub trigger runs on `pull_request.closed` filtered to merged PRs in one SDK repository. The routine ports the change to a parallel SDK in another language and opens a matching PR, keeping the two libraries in step without a human re-implementing each change.

The sections below walk through creating a routine and configuring each of these trigger types.

## Create a routine

Create a routine from the web at [claude.ai/code/routines](https://claude.ai/code/routines), from the Desktop app, or from the CLI. All three surfaces write to the same cloud account, so a routine you create in one shows up in the others immediately. In the Desktop app, click **Routines** in the sidebar, then **New routine**, and choose **Remote**; choosing **Local** instead creates a [Desktop scheduled task](/docs/en/desktop-scheduled-tasks), which runs on your machine rather than in the cloud.

The creation form sets up the routine's prompt, repositories, environment, connectors, and triggers.

Routines run autonomously as full Claude Code cloud sessions: there is no permission-mode picker and no approval prompts during a run. The session can run shell commands, use [skills](/docs/en/skills) committed to the cloned repository, and call any connectors you include. What a routine can reach is determined by the repositories you select and their branch-push setting, the [environment's](/docs/en/claude-code-on-the-web#the-cloud-environment) network access and variables, and the connectors you include. Scope each of those to what the routine actually needs.

Routines belong to your individual claude.ai account. They are not shared with teammates, and they count against your account's daily run allowance. Anything a routine does through your connected GitHub identity or connectors appears as you: commits and pull requests carry your GitHub user, and Slack messages, Linear tickets, or other connector actions use your linked accounts for those services.

### Create from the web

<Steps>
  <Step title="Open the creation form">
    Visit [claude.ai/code/routines](https://claude.ai/code/routines) and click **New routine**.
  </Step>

  <Step title="Name the routine and write the prompt">
    Give the routine a descriptive name and write the prompt Claude runs each time. The prompt is the most important part: the routine runs autonomously, so the prompt must be self-contained and explicit about what to do and what success looks like.

    The prompt input includes a model selector. Claude uses the selected model on every run.
  </Step>

  <Step title="Select repositories">
    Add one or more GitHub repositories for Claude to work in. Each repository is cloned at the start of a run, starting from the default branch. Claude creates `claude/`-prefixed branches for its changes.
  </Step>

  <Step title="Select an environment">
    Pick a [cloud environment](/docs/en/claude-code-on-the-web#the-cloud-environment) for the routine. Environments control what the cloud session has access to:

    * **Network access**: set the level of internet access available during each run
    * **Environment variables**: provide API keys, tokens, or other secrets Claude can use
    * **Setup script**: install dependencies and tools the routine needs. The result is [cached](/docs/en/claude-code-on-the-web#environment-caching), so the script doesn't re-run on every session

    A **Default** environment is provided with **Trusted** network access, which allows the [default set](/docs/en/claude-code-on-the-web#default-allowed-domains) of package registries, cloud provider APIs, container registries, and common development domains, but blocks everything else. If your routine needs to reach your own services or a domain outside that list, edit the environment's [network access](/docs/en/claude-code-on-the-web#network-access) before running. To use a separate environment, [create one](/docs/en/claude-code-on-the-web#configure-your-environment) first.
  </Step>

  <Step title="Select a trigger">
    Under **Select a trigger**, choose how the routine starts. You can pick one trigger type or combine several.

    <Tabs>
      <Tab title="Schedule">
        Pick a preset frequency for a recurring run, or schedule a single one-off run at a specific timestamp. See [Add a schedule trigger](#add-a-schedule-trigger) for timezone handling, stagger, custom cron intervals, and one-off runs.
      </Tab>

      <Tab title="GitHub event">
        Select the repository, the event to react to, and optional filters. See [Add a GitHub trigger](#add-a-github-trigger) for the full list of supported events and filter fields.
      </Tab>

      <Tab title="API">
        Select **API** here, then save the routine. The URL and token are generated after the routine is saved, since they depend on the routine ID. See [Add an API trigger](#add-an-api-trigger) to copy the URL and generate a token.
      </Tab>
    </Tabs>
  </Step>

  <Step title="Review connectors and permissions">
    The **Connectors** and **Permissions** tabs at the bottom of the form control what the routine can reach.

    Under Connectors, all of your connected [MCP connectors](/docs/en/mcp) are included by default. Remove any the routine doesn't need. Claude can use every tool from an included connector, including writes, without asking for permission during a run.

    Under Permissions, enable **Allow unrestricted branch pushes** for any repository where Claude should be able to push to existing branches instead of only `claude/`-prefixed ones.
  </Step>

  <Step title="Create the routine">
    Click **Create**. The routine appears in the list and runs the next time one of its triggers matches. To start a run immediately, click **Run now** on the routine's detail page.

    Each run creates a new session alongside your other sessions, where you can see what Claude did, review changes, and create a pull request.
  </Step>
</Steps>

### Create from the CLI

Run `/schedule` in any session to create a scheduled routine conversationally. You can also pass a description directly, for a recurring routine like `/schedule daily PR review at 9am` or a one-off like `/schedule clean up feature flag in one week`. Claude walks through the same information the web form collects, then saves the routine to your account.

`/schedule` in the CLI creates scheduled routines only. To add an API or GitHub trigger, edit the routine on the web at [claude.ai/code/routines](https://claude.ai/code/routines).

The CLI also supports managing existing routines. Run `/schedule list` to see all routines, `/schedule update` to change one, or `/schedule run` to trigger it immediately.

## Configure triggers

A routine starts when one of its triggers matches. You can attach any combination of schedule, API, and GitHub triggers to the same routine, and add or remove them at any time from the **Select a trigger** section of the routine's edit form.

### Add a schedule trigger

A schedule trigger runs the routine on a recurring cadence, or once at a specific future time. Pick a preset frequency in the **Select a trigger** section: hourly, daily, weekdays, or weekly. Times are entered in your local zone and converted automatically, so the routine runs at that wall-clock time regardless of where the cloud infrastructure is located.

Runs may start a few minutes after the scheduled time due to stagger. The offset is consistent for each routine.

For a custom interval such as every two hours or the first of each month, pick the closest preset in the form, then run `/schedule update` in the CLI to set a specific cron expression. The minimum interval is one hour; expressions that run more frequently are rejected.

#### Schedule a one-off run

A one-off schedule fires the routine a single time at a specific timestamp. Use it to remind yourself later in the week, to open a cleanup PR after a rollout finishes, or to kick off a follow-up task when an upstream change lands. After the routine fires, it auto-disables and the web UI marks it as **Ran**. To run it again, edit the routine and set a new one-off time.

Create a one-off run from the CLI by describing the time in natural language. Claude resolves the phrase against the current time and confirms the absolute timestamp before saving.

```text theme={null}
/schedule tomorrow at 9am, summarize yesterday's merged PRs
```

```text theme={null}
/schedule in 2 weeks, open a cleanup PR that removes the feature flag
```

The same local-to-UTC conversion as recurring schedules applies to one-off timestamps.

One-off runs do not count against the daily routine run cap. They consume your plan's regular subscription usage like any other session. See [Usage and limits](#usage-and-limits) for details.

### Add an API trigger

An API trigger gives a routine a dedicated HTTP endpoint. POSTing to the endpoint with the routine's bearer token starts a new session and returns a session URL. Use this to wire Claude Code into alerting systems, deploy pipelines, internal tools, or anywhere you can make an authenticated HTTP request.

API triggers are added to an existing routine from the web. The CLI cannot currently create or revoke tokens.

<Steps>
  <Step title="Open the routine for editing">
    Go to [claude.ai/code/routines](https://claude.ai/code/routines), click the routine you want to trigger via API, then click the pencil icon to open **Edit routine**.
  </Step>

  <Step title="Add an API trigger">
    Scroll to the **Select a trigger** section below the **Instructions** box, click **Add another trigger**, and choose **API**.
  </Step>

  <Step title="Copy the URL and generate a token">
    The modal shows the URL for this routine along with a sample curl command. Copy the URL, then click **Generate token** and copy the token immediately. The token is shown once and cannot be retrieved later, so store it somewhere secure such as your alerting tool's secret store.
  </Step>

  <Step title="Call the endpoint">
    Send the token in the `Authorization: Bearer` header when you POST to the URL. The [Trigger a routine](#trigger-a-routine) section below shows a complete example.
  </Step>
</Steps>

Each routine has its own token, scoped to triggering that routine only. To rotate or revoke it, return to the same modal and click **Regenerate** or **Revoke**.

#### Trigger a routine

Send a POST request to the `/fire` endpoint with the bearer token in the `Authorization` header. The request body accepts an optional `text` field for run-specific context such as an alert body or a failing log, passed to the routine alongside its saved prompt. The value is freeform text and is not parsed: if you send JSON or another structured payload, the routine receives it as a literal string.

The example below triggers a routine from a shell:

```bash theme={null}
curl -X POST https://api.anthropic.com/v1/claude_code/routines/trig_01ABCDEFGHJKLMNOPQRSTUVW/fire \
  -H "Authorization: Bearer sk-ant-oat01-xxxxx" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"text": "Sentry alert SEN-4521 fired in prod. Stack trace attached."}'
```

A successful request returns a JSON body with the new session ID and URL:

```json theme={null}
{
  "type": "routine_fire",
  "claude_code_session_id": "session_01HJKLMNOPQRSTUVWXYZ",
  "claude_code_session_url": "https://claude.ai/code/session_01HJKLMNOPQRSTUVWXYZ"
}
```

Open the session URL in a browser to watch the run in real time, review changes, or continue the conversation manually.

<Warning>
  The `/fire` endpoint ships under the `experimental-cc-routine-2026-04-01` beta header. Request and response shapes, rate limits, and token semantics may change while the feature is in research preview. Breaking changes ship behind new dated beta header versions, and the two most recent previous header versions continue to work so that callers have time to migrate.
</Warning>

#### API reference

For the full API reference, including all error responses, validation rules, and field limits, see [Trigger a routine via API](https://platform.claude.com/docs/en/api/claude-code/routines-fire) in the Claude Platform documentation.

The `/fire` endpoint is available to claude.ai users only and is not part of the Claude Platform API surface.

### Add a GitHub trigger

A GitHub trigger starts a new session automatically when a matching event occurs on a connected repository. Each matching event starts its own session.

<Note>
  During the research preview, GitHub webhook events are subject to per-routine and per-account hourly caps. Events beyond the limit are dropped until the window resets. See your current limits at [claude.ai/code/routines](https://claude.ai/code/routines).
</Note>

GitHub triggers are configured from the web UI only.

<Steps>
  <Step title="Open the routine for editing">
    Go to [claude.ai/code/routines](https://claude.ai/code/routines), click the routine, then click the pencil icon to open **Edit routine**.
  </Step>

  <Step title="Add a GitHub event trigger">
    Scroll to the **Select a trigger** section, click **Add another trigger**, and choose **GitHub event**.
  </Step>

  <Step title="Install the Claude GitHub App">
    The Claude GitHub App must be installed on the repository you want to subscribe to. The trigger setup prompts you to install it if it isn't already.

    <Note>
      Running `/web-setup` in the CLI grants repository access for cloning, but it does not install the Claude GitHub App and does not enable webhook delivery. GitHub triggers require installing the Claude GitHub App, which the trigger setup prompts you to do.
    </Note>
  </Step>

  <Step title="Configure the trigger">
    Select the repository, choose an event from the [supported events](#supported-events) list, and optionally add filters. Save the trigger.
  </Step>
</Steps>

#### Supported events

GitHub triggers can subscribe to either of the following event categories. Within each category you can pick a specific action, such as `pull_request.opened`, or react to all actions in the category.

| Event        | Triggers when                                                                 |
| :----------- | :---------------------------------------------------------------------------- |
| Pull request | A PR is opened, closed, assigned, labeled, synchronized, or otherwise updated |
| Release      | A release is created, published, edited, or deleted                           |

#### Filter pull requests

Use filters to narrow which pull requests start a new session. All filter conditions must match for the routine to trigger. The available filter fields are:

| Filter      | Matches                          |
| :---------- | :------------------------------- |
| Author      | PR author's GitHub username      |
| Title       | PR title text                    |
| Body        | PR description text              |
| Base branch | Branch the PR targets            |
| Head branch | Branch the PR comes from         |
| Labels      | Labels applied to the PR         |
| Is draft    | Whether the PR is in draft state |
| Is merged   | Whether the PR has been merged   |

Each filter pairs a field with an operator: equals, contains, starts with, is one of, is not one of, or matches regex.

The `matches regex` operator tests the entire field value, not a substring within it. To match any title containing `hotfix`, write `.*hotfix.*`. Without the surrounding `.*`, the filter matches only a title that is exactly `hotfix` with nothing before or after. For literal substring matching without regex syntax, use the `contains` operator instead.

A few example filter combinations:

* **Auth module review**: base branch `main`, head branch contains `auth-provider`. Sends any PR that touches authentication to a focused reviewer.
* **Ready-for-review only**: is draft is `false`. Skips drafts so the routine only runs when the PR is ready for review.
* **Label-gated backport**: labels include `needs-backport`. Triggers a port-to-another-branch routine only when a maintainer tags the PR.

#### How sessions map to events

Each matching GitHub event starts a new session. Session reuse across events is not available for GitHub-triggered routines, so two PR updates produce two independent sessions.

## Manage routines

Click a routine in the list to open its detail page. The detail page shows the routine's repositories, connectors, prompt, schedule, API tokens, GitHub triggers, and a list of past runs.

### View and interact with runs

Click any run to open it as a full session. From there you can see what Claude did, review changes, create a pull request, or continue the conversation. Each run session works like any other session: use the dropdown menu next to the session title to rename, archive, or delete it.

<Note>
  A green status in the run list means the session started and exited without an infrastructure error. It does not mean the task in your prompt succeeded. Open the run to read the transcript and confirm what Claude actually did. Blocked network requests, missing connector tools, and task-level failures all surface there rather than in the status indicator.
</Note>

### Edit and control routines

From the routine detail page you can:

* Click **Run now** to start a run immediately without waiting for the next scheduled time.
* Use the toggle in the **Repeats** section to pause or resume the schedule. Paused routines keep their configuration but don't run until you re-enable them.
* Click the pencil icon to open **Edit routine** and change the name, prompt, repositories, environment, connectors, or any of the routine's triggers. The **Select a trigger** section is where you add or remove schedules, API tokens, and GitHub event triggers.
* Click the delete icon to remove the routine. Past sessions created by the routine remain in your session list.

### Repositories and branch permissions

Routines need GitHub access to clone repositories. When you create a routine from the CLI with `/schedule`, Claude checks whether your account has GitHub connected and prompts you to run `/web-setup` if it doesn't. See [GitHub authentication options](/docs/en/claude-code-on-the-web#github-authentication-options) for the two ways to grant access.

Each repository you add is cloned on every run. Claude starts from the repository's default branch unless your prompt specifies otherwise.

By default, Claude can only push to branches prefixed with `claude/`. This prevents routines from accidentally modifying protected or long-lived branches. To remove this restriction for a specific repository, enable **Allow unrestricted branch pushes** for that repository when creating or editing the routine.

### Connectors

Routines can use your connected MCP connectors to read from and write to external services during each run. For example, a routine that triages support requests might read from a Slack channel and create issues in Linear.

Connectors are the [claude.ai integrations](/docs/en/mcp#use-mcp-servers-from-claude-ai) on your account. MCP servers you added locally in the CLI with `claude mcp add` are stored on your machine rather than your claude.ai account, so they do not appear in the connectors list. To use one of those servers in a routine, add it as a connector at [claude.ai/customize/connectors](https://claude.ai/customize/connectors), or declare it in a committed [`.mcp.json`](/docs/en/mcp#project-scope) so it is part of the cloned repository.

When you create a routine, all of your currently connected connectors are included by default. Remove any that aren't needed to limit which tools Claude has access to during the run. You can also add connectors directly from the routine form.

To manage or add connectors outside of the routine form, visit **Settings > Connectors** on claude.ai or use `/schedule update` in the CLI.

### Environments and network access

Each routine runs in a [cloud environment](/docs/en/claude-code-on-the-web#the-cloud-environment) that controls network access, environment variables, and setup scripts. The routine inherits the environment's network policy on every run.

The **Default** environment uses **Trusted** network access: the [default allowlist](/docs/en/claude-code-on-the-web#default-allowed-domains) of package registries, cloud provider APIs, container registries, and common development domains is reachable, but arbitrary domains are not. Outbound requests to other hosts fail with `403` and `x-deny-reason: host_not_allowed`. MCP connector traffic is routed through Anthropic's servers, so the connectors you add to the routine work without adding their hosts to **Allowed domains**. Remove any connectors you don't need under [Connectors](#connectors).

To allow additional domains:

<Steps>
  <Step title="Open the routine for editing">
    On the routine's detail page, click the pencil icon to open **Edit routine**.
  </Step>

  <Step title="Open the environment selector">
    Below the **Instructions** box, select the cloud icon showing your environment's name, such as **Default**.
  </Step>

  <Step title="Open the environment settings">
    Hover over the environment in the list and click the settings icon that appears on the right.
  </Step>

  <Step title="Change the network access level">
    In the **Update cloud environment** dialog, change **Network access** to **Custom** and enter your domains in **Allowed domains**. Check **Also include default list of common package managers** to keep the [default allowlist](/docs/en/claude-code-on-the-web#default-allowed-domains) alongside your custom domains. Select **Full** instead for unrestricted access.
  </Step>

  <Step title="Save">
    Click **Save changes**. The new policy applies from the next run.
  </Step>
</Steps>

See [Network access](/docs/en/claude-code-on-the-web#network-access) for details on access levels and the default allowlist.

## Usage and limits

Routines draw down subscription usage the same way interactive sessions do. In addition to the standard subscription limits, routines have a daily cap on how many runs can start per account. See your current consumption and remaining daily routine runs at [claude.ai/code/routines](https://claude.ai/code/routines) or [claude.ai/settings/usage](https://claude.ai/settings/usage).

When a routine hits the daily cap or your subscription usage limit, organizations with usage credits turned on can keep running routines on metered overage. Without usage credits, additional runs are rejected until the window resets. Turn on usage credits from **Settings > Billing** on claude.ai.

One-off runs do not count against the daily routine cap. They draw down your regular subscription usage like any other session, but they are exempt from the per-account daily routine run allowance.

## Troubleshooting

### `/schedule` returns "Unknown command"

The CLI hides `/schedule` when one of its requirements is not met. The cause is usually one of the following:

* You are authenticated with a Console API key or a cloud provider such as Bedrock, Vertex, or Foundry. `/schedule` requires a claude.ai subscription login. If `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` is set in your shell, or `apiKeyHelper` is set in `settings.json`, remove it first, since these take precedence over a claude.ai login
* `DISABLE_TELEMETRY`, `DO_NOT_TRACK`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, or `DISABLE_GROWTHBOOK` is set in your shell environment or in the `env` block of a [`settings.json` file](/docs/en/settings#available-settings). These disable feature-flag fetching, which `/schedule` depends on
* You are inside a Claude Code on the web session. Manage routines from the [web UI](https://claude.ai/code/routines) instead
* Your CLI is older than v2.1.81. Run `claude update`

You can always create and manage routines at [claude.ai/code/routines](https://claude.ai/code/routines) regardless of how the CLI is configured.

### "Routines are disabled by your organization's policy"

Your Team or Enterprise admin has likely turned off the **Routines** toggle at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code). This is a server-side organization setting, so it cannot be overridden from your local configuration. Contact your admin to request that routines be enabled for your organization.

## Related resources

* [`/loop` and in-session scheduling](/docs/en/scheduled-tasks): schedule local tasks within an open CLI session
* [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks): local scheduled tasks that run on your machine with access to local files
* [Cloud environment](/docs/en/claude-code-on-the-web#the-cloud-environment): configure the runtime environment for cloud sessions
* [MCP connectors](/docs/en/mcp): connect external services like Slack, Linear, and Google Drive
* [GitHub Actions](/docs/en/github-actions): run Claude in your CI pipeline on repository events


---

## Run prompts on a schedule

`https://code.claude.com/docs/en/scheduled-tasks`

Use /loop and the cron scheduling tools to run prompts repeatedly, poll for status, or set one-time reminders within a Claude Code session.

<Note>
  Scheduled tasks require Claude Code v2.1.72 or later. Check your version with `claude --version`.
</Note>

Scheduled tasks let Claude re-run a prompt automatically on an interval. Use them to poll a deployment, babysit a PR, check back on a long-running build, or remind yourself to do something later in the session. To react to events as they happen instead of polling, see [Channels](/docs/en/channels): your CI can push the failure into the session directly. To keep the session working turn after turn until a condition is met rather than on an interval, see [`/goal`](/docs/en/goal).

Tasks are session-scoped: they live in the current conversation and stop when you start a new one. Resuming with `--resume` or `--continue` brings back any task that hasn't [expired](#seven-day-expiry): a recurring task created within the last 7 days, or a one-shot whose scheduled time hasn't passed yet. For scheduling that survives independently of any session, use [Routines](/docs/en/routines) to create a routine on Anthropic-managed infrastructure, set up a [Desktop scheduled task](/docs/en/desktop-scheduled-tasks), or use [GitHub Actions](/docs/en/github-actions).

## Compare scheduling options

Claude Code offers three ways to schedule recurring or one-off work:

|                            | [Cloud](/docs/en/routines)          | [Desktop](/docs/en/desktop-scheduled-tasks) | [`/loop`](/docs/en/scheduled-tasks)      |
| :------------------------- | :----------------------------- | :------------------------------------- | :---------------------------------- |
| Runs on                    | Anthropic cloud                | Your machine                           | Your machine                        |
| Requires machine on        | No                             | Yes                                    | Yes                                 |
| Requires open session      | No                             | No                                     | Yes                                 |
| Persistent across restarts | Yes                            | Yes                                    | Restored on `--resume` if unexpired |
| Access to local files      | No (fresh clone)               | Yes                                    | Yes                                 |
| MCP servers                | Connectors configured per task | [Config files](/docs/en/mcp) and connectors | Inherits from session               |
| Permission prompts         | No (runs autonomously)         | Configurable per task                  | Inherits from session               |
| Customizable schedule      | Via `/schedule` in the CLI     | Yes                                    | Yes                                 |
| Minimum interval           | 1 hour                         | 1 minute                               | 1 minute                            |

<Tip>
  Use **cloud tasks** for work that should run reliably without your machine. Use **Desktop tasks** when you need access to local files and tools. Use **`/loop`** for quick polling during a session.
</Tip>

## Run a prompt repeatedly with /loop

The `/loop` [bundled skill](/docs/en/commands) is the quickest way to run a prompt on repeat while the session stays open. Both the interval and the prompt are optional, and what you provide determines how the loop behaves.

| What you provide          | Example                     | What happens                                                                                                  |
| :------------------------ | :-------------------------- | :------------------------------------------------------------------------------------------------------------ |
| Interval and prompt       | `/loop 5m check the deploy` | Your prompt runs on a [fixed schedule](#run-on-a-fixed-interval)                                              |
| Prompt only               | `/loop check the deploy`    | Your prompt runs at an [interval Claude chooses](#let-claude-choose-the-interval) each iteration              |
| Interval only, or nothing | `/loop`                     | The [built-in maintenance prompt](#run-the-built-in-maintenance-prompt) runs, or your `loop.md` if one exists |

You can also pass another command as the prompt, for example `/loop 20m /review-pr 1234`, to re-run a packaged workflow each iteration.

### Run on a fixed interval

When you supply an interval, Claude converts it to a cron expression, schedules the job, and confirms the cadence and job ID.

```text theme={null}
/loop 5m check if the deployment finished and tell me what happened
```

The interval can lead the prompt as a bare token like `30m`, or trail it as a clause like `every 2 hours`. Supported units are `s` for seconds, `m` for minutes, `h` for hours, and `d` for days.

Seconds are rounded up to the nearest minute since cron has one-minute granularity. Intervals that don't map to a clean cron step, such as `7m` or `90m`, are rounded to the nearest interval that does and Claude tells you what it picked.

### Let Claude choose the interval

When you omit the interval, Claude chooses one dynamically instead of running on a fixed cron schedule. After each iteration it picks a delay between one minute and one hour based on what it observed: short waits while a build is finishing or a PR is active, longer waits when nothing is pending. The chosen delay and the reason for it are printed at the end of each iteration.

The example below checks CI and review comments, with Claude waiting longer between iterations once the PR goes quiet:

```text theme={null}
/loop check whether CI passed and address any review comments
```

When you ask for a dynamic `/loop` schedule, Claude may use the [Monitor tool](/docs/en/tools-reference#monitor-tool) directly. Monitor runs a background script and streams each output line back, which avoids polling altogether and is often more token-efficient and responsive than re-running a prompt on an interval.

A dynamically scheduled loop appears in your [scheduled task list](#manage-scheduled-tasks) like any other task, so you can list or cancel it the same way. The [jitter rules](#jitter) don't apply to it, but the [seven-day expiry](#seven-day-expiry) does: the loop ends automatically seven days after you start it.

<Note>
  On Bedrock, Vertex AI, and Microsoft Foundry, a prompt with no interval runs on a fixed 10-minute schedule instead.
</Note>

### Run the built-in maintenance prompt

When you omit the prompt, Claude uses a built-in maintenance prompt instead of one you supply. On each iteration it works through the following, in order:

* continue any unfinished work from the conversation
* tend to the current branch's pull request: review comments, failed CI runs, merge conflicts
* run cleanup passes such as bug hunts or simplification when nothing else is pending

Claude does not start new initiatives outside that scope, and irreversible actions such as pushing or deleting only proceed when they continue something the transcript already authorized.

```text theme={null}
/loop
```

A bare `/loop` runs this prompt at a [dynamically chosen interval](#let-claude-choose-the-interval). Add an interval, for example `/loop 15m`, to run it on a fixed schedule instead. To replace the built-in prompt with your own default, see [Customize the default prompt with loop.md](#customize-the-default-prompt-with-loop-md).

<Note>
  On Bedrock, Vertex AI, and Microsoft Foundry, `/loop` with no prompt prints the usage message instead of running the maintenance prompt.
</Note>

### Customize the default prompt with loop.md

A `loop.md` file replaces the built-in maintenance prompt with your own instructions. It defines a single default prompt for bare `/loop`, not a list of separate scheduled tasks, and is ignored whenever you supply a prompt on the command line. To schedule additional prompts alongside it, use `/loop <prompt>` or [ask Claude directly](#manage-scheduled-tasks).

Claude looks for the file in two locations and uses the first one it finds.

| Path                | Scope                                                            |
| :------------------ | :--------------------------------------------------------------- |
| `.claude/loop.md`   | Project-level. Takes precedence when both files exist.           |
| `~/.claude/loop.md` | User-level. Applies in any project that does not define its own. |

The file is plain Markdown with no required structure. Write it as if you were typing the `/loop` prompt directly. The following example keeps a release branch healthy:

```markdown title=".claude/loop.md" theme={null}
Check the `release/next` PR. If CI is red, pull the failing job log,
diagnose, and push a minimal fix. If new review comments have arrived,
address each one and resolve the thread. If everything is green and
quiet, say so in one line.
```

Edits to `loop.md` take effect on the next iteration, so you can refine the instructions while a loop is running. When no `loop.md` exists in either location, the loop falls back to the built-in maintenance prompt. Keep the file concise: content beyond 25,000 bytes is truncated.

<Note>
  On Bedrock, Vertex AI, and Microsoft Foundry, `loop.md` isn't read and `/loop` with no prompt prints the usage message instead.
</Note>

### Stop a loop

To stop a `/loop` while it is waiting for the next iteration, press `Esc`. This clears the pending wakeup so the loop does not fire again. Tasks you scheduled by [asking Claude directly](#manage-scheduled-tasks) are not affected by `Esc` and stay in place until you delete them.

In [self-paced mode](#let-claude-choose-the-interval), Claude can also end the loop on its own by not scheduling the next wakeup once the task is provably complete. Loops on a fixed interval keep running until you stop them or [seven days elapse](#seven-day-expiry).

## Set a one-time reminder

For one-shot reminders, describe what you want in natural language instead of using `/loop`. Claude schedules a single-fire task that deletes itself after running.

```text theme={null}
remind me at 3pm to push the release branch
```

```text theme={null}
in 45 minutes, check whether the integration tests passed
```

Claude pins the fire time to a specific minute and hour using a cron expression and confirms when it will fire.

## Manage scheduled tasks

Ask Claude in natural language to list or cancel tasks, or reference the underlying tools directly.

```text theme={null}
what scheduled tasks do I have?
```

```text theme={null}
cancel the deploy check job
```

Under the hood, Claude uses these tools:

| Tool         | Purpose                                                                                                         |
| :----------- | :-------------------------------------------------------------------------------------------------------------- |
| `CronCreate` | Schedule a new task. Accepts a 5-field cron expression, the prompt to run, and whether it recurs or fires once. |
| `CronList`   | List all scheduled tasks with their IDs, schedules, and prompts.                                                |
| `CronDelete` | Cancel a task by ID.                                                                                            |

Each scheduled task has an 8-character ID you can pass to `CronDelete`. A session can hold up to 50 scheduled tasks at once.

## How scheduled tasks run

The scheduler checks every second for due tasks and enqueues them at low priority. A scheduled prompt fires between your turns, not while Claude is mid-response. If Claude is busy when a task comes due, the prompt waits until the current turn ends.

All times are interpreted in your local timezone. A cron expression like `0 9 * * *` means 9am wherever you're running Claude Code, not UTC.

### Jitter

To avoid every session hitting the API at the same wall-clock moment, the scheduler adds a deterministic offset to fire times:

* Recurring tasks fire up to 30 minutes after the scheduled time (or up to half the interval, for tasks that run more often than hourly). An hourly job scheduled for `:00` may fire anywhere up to `:30`.
* One-shot tasks scheduled for the top or bottom of the hour fire up to 90 seconds early.

The offset is derived from the task ID, so the same task always gets the same offset. If exact timing matters, pick a minute that is not `:00` or `:30`, for example `3 9 * * *` instead of `0 9 * * *`, and the one-shot jitter will not apply.

### Seven-day expiry

Recurring tasks automatically expire 7 days after creation. The task fires one final time, then deletes itself. This bounds how long a forgotten loop can run. If you need a recurring task to last longer, cancel and recreate it before it expires, or use [Routines](/docs/en/routines) or [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks) for durable scheduling.

## Cron expression reference

`CronCreate` accepts standard 5-field cron expressions: `minute hour day-of-month month day-of-week`. All fields support wildcards (`*`), single values (`5`), steps (`*/15`), ranges (`1-5`), and comma-separated lists (`1,15,30`).

| Example        | Meaning                      |
| :------------- | :--------------------------- |
| `*/5 * * * *`  | Every 5 minutes              |
| `0 * * * *`    | Every hour on the hour       |
| `7 * * * *`    | Every hour at 7 minutes past |
| `0 9 * * *`    | Every day at 9am local       |
| `0 9 * * 1-5`  | Weekdays at 9am local        |
| `30 14 15 3 *` | March 15 at 2:30pm local     |

Day-of-week uses `0` or `7` for Sunday through `6` for Saturday. Extended syntax like `L`, `W`, `?`, and name aliases such as `MON` or `JAN` is not supported.

When both day-of-month and day-of-week are constrained, a date matches if either field matches. This follows standard vixie-cron semantics.

## Disable scheduled tasks

Set `CLAUDE_CODE_DISABLE_CRON=1` in your environment to disable the scheduler entirely. The cron tools and `/loop` become unavailable, and any already-scheduled tasks stop firing. See [Environment variables](/docs/en/env-vars) for the full list of disable flags.

## Limitations

Session-scoped scheduling has inherent constraints:

* Tasks only fire while Claude Code is running and idle. Closing the terminal or letting the session exit stops them firing.
* No catch-up for missed fires. If a task's scheduled time passes while Claude is busy on a long-running request, it fires once when Claude becomes idle, not once per missed interval.
* Starting a fresh conversation clears all session-scoped tasks. Resuming with `claude --resume` or `claude --continue` restores tasks that have not expired: recurring tasks within seven days of creation, and one-shot tasks whose scheduled time has not yet passed. Background Bash and monitor tasks are never restored on resume.

For cron-driven automation that needs to run unattended:

* [Routines](/docs/en/routines): run on Anthropic-managed infrastructure on a schedule, via API call, or on GitHub events
* [GitHub Actions](/docs/en/github-actions): use a `schedule` trigger in CI
* [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks): run locally on your machine


---

## Schedule recurring tasks in Claude Code Desktop

`https://code.claude.com/docs/en/desktop-scheduled-tasks`

Set up scheduled tasks in Claude Code Desktop to run Claude automatically on a recurring basis for daily code reviews, dependency audits, or morning briefings.

Scheduled tasks start a new session automatically at a time and frequency you choose. Use them for recurring work like daily code reviews, dependency update checks, or morning briefings that pull from your calendar and inbox.

The Desktop app's **Routines** page lets you create both local scheduled tasks and remote [routines](/docs/en/routines). A local task runs on your machine with direct access to your files and tools, but only fires while the app is open and your computer is awake. A remote routine runs on Anthropic-managed cloud infrastructure even when your computer is off, and can also fire on API calls or GitHub events. This page covers local scheduled tasks; for remote routines and their trigger options, see [Routines](/docs/en/routines).

## Compare scheduling options

Claude Code offers three ways to schedule recurring or one-off work:

|                            | [Cloud](/docs/en/routines)          | [Desktop](/docs/en/desktop-scheduled-tasks) | [`/loop`](/docs/en/scheduled-tasks)      |
| :------------------------- | :----------------------------- | :------------------------------------- | :---------------------------------- |
| Runs on                    | Anthropic cloud                | Your machine                           | Your machine                        |
| Requires machine on        | No                             | Yes                                    | Yes                                 |
| Requires open session      | No                             | No                                     | Yes                                 |
| Persistent across restarts | Yes                            | Yes                                    | Restored on `--resume` if unexpired |
| Access to local files      | No (fresh clone)               | Yes                                    | Yes                                 |
| MCP servers                | Connectors configured per task | [Config files](/docs/en/mcp) and connectors | Inherits from session               |
| Permission prompts         | No (runs autonomously)         | Configurable per task                  | Inherits from session               |
| Customizable schedule      | Via `/schedule` in the CLI     | Yes                                    | Yes                                 |
| Minimum interval           | 1 hour                         | 1 minute                               | 1 minute                            |

<Tip>
  Use **cloud tasks** for work that should run reliably without your machine. Use **Desktop tasks** when you need access to local files and tools. Use **`/loop`** for quick polling during a session.
</Tip>

<Note>
  By default, scheduled tasks run against whatever state your working directory is in, including uncommitted changes. Enable the worktree toggle when creating the task to give each run its own isolated Git worktree, the same way [parallel sessions](/docs/en/desktop#work-in-parallel-with-sessions) work.
</Note>

## Create a scheduled task

Click **Routines** in the sidebar, then click **New routine** and choose **Local**. Configure these fields:

| Field        | Description                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name         | Identifier for the task. Converted to lowercase kebab-case and used as the folder name on disk. Must be unique across your tasks.                                                                                                                                              |
| Description  | Short summary shown in the task list.                                                                                                                                                                                                                                          |
| Instructions | What Claude should do when the task runs. Write this the same way you'd write any message in the prompt box. The instructions input includes pickers for the permission mode and model, and below it you select the working folder and whether to run in an isolated worktree. |
| Schedule     | How often the task runs. See [schedule options](#schedule-options) below.                                                                                                                                                                                                      |

A folder is required before you can save the task. If you haven't trusted that folder yet, Desktop prompts you to trust it before saving.

You can also create a task by describing what you want in any session. For example, "set up a daily code review that runs every morning at 9am" creates a recurring task, and "remind me at 3pm tomorrow to check the deploy" creates a one-time task that disables itself after it fires.

## Schedule options

Pick a preset from the Schedule control:

* **Manual**: no schedule, only runs when you click **Run now**. Useful for saving a prompt you trigger on demand
* **Hourly**: runs every hour
* **Daily**: shows a time picker, defaults to 9:00 AM local time
* **Weekdays**: same as Daily but skips Saturday and Sunday
* **Weekly**: shows a time picker and a day picker

For intervals the picker doesn't offer, such as every 15 minutes, the first of each month, or a single run at a specific future time, ask Claude in any Desktop session to set the schedule. Use plain language; for example, "schedule a task to run all the tests every 6 hours."

## How scheduled tasks run

Scheduled tasks run on your machine. Desktop checks the schedule every minute while the app is open and starts a fresh session when a task is due, independent of any manual sessions you have open. Each task gets a small delay of a few minutes after the scheduled time to stagger API traffic. The delay is deterministic: the same task always starts at the same offset.

When a task fires, you get a desktop notification and a new session appears under a **Scheduled** section in the sidebar. Open it to see what Claude did, review changes, or respond to permission prompts. The session works like any other: Claude can edit files, run commands, create commits, and open pull requests.

Tasks only run while the desktop app is running and your computer is awake. If your computer sleeps through a scheduled time, the run is skipped. To prevent idle-sleep, enable **Keep computer awake** in Settings under **Desktop app → General**. Closing the laptop lid still puts it to sleep. For tasks that need to run even when your computer is off, or that should trigger on an API call or GitHub event, create a remote [routine](/docs/en/routines) instead.

## Missed runs

When the app starts or your computer wakes, Desktop checks whether each task missed any runs in the last seven days. If it did, Desktop starts exactly one catch-up run for the most recently missed time and discards anything older. A daily task that missed six days runs once on wake. Desktop shows a notification when a catch-up run starts.

Keep this in mind when writing prompts. A task scheduled for 9am might run at 11pm if your computer was asleep all day. If timing matters, add guardrails to the prompt itself, for example: "Only review today's commits. If it's after 5pm, skip the review and just post a summary of what was missed."

## Permissions for scheduled tasks

Each task has its own permission mode, which you set when creating or editing the task. Allow rules from `~/.claude/settings.json` also apply to scheduled task sessions. If a task runs in Ask mode and needs to run a tool it doesn't have permission for, the run stalls until you approve it. The session stays open in the sidebar so you can answer later.

To avoid stalls, click **Run now** after creating a task, watch for permission prompts, and select "always allow" for each one. Future runs of that task auto-approve the same tools without prompting. You can review and revoke these approvals from the task's detail page.

## Manage scheduled tasks

Click a task in the **Routines** list to open its detail page. From here you can:

* **Run now**: start the task immediately without waiting for the next scheduled time
* **Status**: toggle between Active and Paused to pause or resume scheduled runs without deleting the task
* **Edit**: change the instructions, schedule, folder, or other settings
* **Review history**: see every past run, including skipped runs. Hover a skipped entry to see why: your computer was asleep, the previous run was still in progress, or other scheduled tasks were already running. Click **Show more** to load older entries.
* **Review allowed permissions**: see and revoke saved tool approvals for this task from the **Always allowed** panel
* **Delete**: remove the task and archive all sessions it created. An **Also delete files on disk** checkbox appears in the confirmation dialog; check it to also remove the task's `SKILL.md` file and associated data from `~/.claude/scheduled-tasks/`.

You can also list, create, edit, and pause tasks by asking Claude in any Desktop session. For example, "pause my dependency-audit task" or "show me my scheduled tasks." To delete a task, use the **Delete** button on its detail page.

A scheduled task can also modify its own schedule or prompt from within a running session using the `update_scheduled_task` MCP tool. This lets a task reschedule itself based on what it finds, for example, rescheduling a code review to run earlier when it detects a release branch has been created.

To edit a task's prompt on disk, open `~/.claude/scheduled-tasks/<task-name>/SKILL.md` (or under [`CLAUDE_CONFIG_DIR`](/docs/en/env-vars) if set). The file uses YAML frontmatter for `name` and `description`, with the prompt as the body. Changes take effect on the next run. Schedule, folder, model, and enabled state are not in this file: change them through the Edit form or ask Claude.

## Related resources

* [Routines](/docs/en/routines): run tasks on Anthropic-managed infrastructure on a schedule, via API call, or in response to GitHub events, even when your computer is off
* [Run prompts on a schedule](/docs/en/scheduled-tasks): session-scoped scheduling with `/loop` in the CLI
* [Claude Code GitHub Actions](/docs/en/github-actions): run Claude on a schedule in CI instead of on your machine
* [Use Claude Code Desktop](/docs/en/desktop): the full Desktop app guide
