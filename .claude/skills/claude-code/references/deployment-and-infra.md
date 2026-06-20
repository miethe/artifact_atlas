# Deployment, Providers & Infrastructure

_Claude Code documentation — Deployment, Providers & Infrastructure. Source: https://code.claude.com/docs/en/_


---

## Enterprise deployment overview

`https://code.claude.com/docs/en/third-party-integrations`

Learn how Claude Code can integrate with various third-party services and infrastructure to meet enterprise deployment requirements.

Organizations can deploy Claude Code through Anthropic directly or through a cloud provider. This page helps you choose the right configuration.

<ContactSalesCard />

## Compare deployment options

For most organizations, Claude for Teams or Claude for Enterprise provides the best experience. Team members get access to both Claude Code and Claude on the web with a single subscription, centralized billing, and no infrastructure setup required.

**Claude for Teams** is self-service and includes collaboration features, admin tools, and billing management. Best for smaller teams that need to get started quickly.

**Claude for Enterprise** adds SSO and domain capture, role-based permissions, compliance API access, and managed policy settings for deploying organization-wide Claude Code configurations. Best for larger organizations with security and compliance requirements.

Learn more about [Team plans](https://support.claude.com/en/articles/9266767-what-is-the-team-plan) and [Enterprise plans](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan).

If your organization has specific infrastructure requirements, compare the options below:

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Claude for Teams/Enterprise</th>
      <th>Anthropic Console</th>
      <th>Amazon Bedrock</th>
      <th>Claude Platform on AWS</th>
      <th>Google Vertex AI</th>
      <th>Microsoft Foundry</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>Best for</td>
      <td>Most organizations (recommended)</td>
      <td>Individual developers</td>
      <td>AWS-native deployments</td>
      <td>AWS Marketplace billing with Claude API features</td>
      <td>GCP-native deployments</td>
      <td>Azure-native deployments</td>
    </tr>

    <tr>
      <td>Billing</td>
      <td><strong>Teams:</strong> \$150/seat (Premium) with PAYG available<br /><strong>Enterprise:</strong> <a href="https://claude.com/contact-sales?utm_source=claude_code&utm_medium=docs&utm_content=third_party_enterprise">Contact Sales</a></td>
      <td>PAYG</td>
      <td>PAYG through AWS</td>
      <td>PAYG through AWS Marketplace</td>
      <td>PAYG through GCP</td>
      <td>PAYG through Azure</td>
    </tr>

    <tr>
      <td>Regions</td>
      <td>Supported [countries](https://www.anthropic.com/supported-countries)</td>
      <td>Supported [countries](https://www.anthropic.com/supported-countries)</td>
      <td>Multiple AWS [regions](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html)</td>
      <td>Multiple AWS regions</td>
      <td>Multiple GCP [regions](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)</td>
      <td>Multiple Azure [regions](https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/)</td>
    </tr>

    <tr>
      <td>Prompt caching</td>
      <td>Enabled by default</td>
      <td>Enabled by default</td>
      <td>Enabled by default</td>
      <td>Enabled by default</td>
      <td>Enabled by default</td>
      <td>Enabled by default</td>
    </tr>

    <tr>
      <td>Authentication</td>
      <td>Claude.ai SSO or email</td>
      <td>API key</td>
      <td>API key or AWS credentials</td>
      <td>API key or AWS credentials</td>
      <td>GCP credentials</td>
      <td>API key or Microsoft Entra ID</td>
    </tr>

    <tr>
      <td>Cost tracking</td>
      <td>Usage dashboard</td>
      <td>Usage dashboard</td>
      <td>AWS Cost Explorer</td>
      <td>AWS Cost Explorer</td>
      <td>GCP Billing</td>
      <td>Azure Cost Management</td>
    </tr>

    <tr>
      <td>Includes Claude on web</td>
      <td>Yes</td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
    </tr>

    <tr>
      <td>Enterprise features</td>
      <td>Team management, SSO, usage monitoring</td>
      <td>None</td>
      <td>IAM policies, CloudTrail</td>
      <td>IAM policies, CloudTrail</td>
      <td>IAM roles, Cloud Audit Logs</td>
      <td>RBAC policies, Azure Monitor</td>
    </tr>
  </tbody>
</table>

Select a deployment option to view setup instructions:

* [Claude for Teams or Enterprise](/docs/en/authentication#claude-for-teams-or-enterprise)
* [Anthropic Console](/docs/en/authentication#claude-console-authentication)
* [Amazon Bedrock](/docs/en/amazon-bedrock)
* [Claude Platform on AWS](/docs/en/claude-platform-on-aws)
* [Google Vertex AI](/docs/en/google-vertex-ai)
* [Microsoft Foundry](/docs/en/microsoft-foundry)

## Configure proxies and gateways

Most organizations can use a cloud provider directly without additional configuration. However, you may need to configure a corporate proxy or LLM gateway if your organization has specific network or management requirements. These are different configurations that can be used together:

* **Corporate proxy**: Routes traffic through an HTTP/HTTPS proxy. Use this if your organization requires all outbound traffic to pass through a proxy server for security monitoring, compliance, or network policy enforcement. Configure with the `HTTPS_PROXY` or `HTTP_PROXY` environment variables. Learn more in [Enterprise network configuration](/docs/en/network-config).
* **LLM Gateway**: A service that sits between Claude Code and the cloud provider to handle authentication and routing. Use this if you need centralized usage tracking across teams, custom rate limiting or budgets, or centralized authentication management. Configure with the `ANTHROPIC_BASE_URL`, `ANTHROPIC_BEDROCK_BASE_URL`, `ANTHROPIC_AWS_BASE_URL`, or `ANTHROPIC_VERTEX_BASE_URL` environment variables. Learn more in [LLM gateway configuration](/docs/en/llm-gateway).

The following examples show the environment variables to set in your shell or shell profile (`.bashrc`, `.zshrc`). See [Settings](/docs/en/settings) for other configuration methods.

### Amazon Bedrock

<Tabs>
  <Tab title="Corporate proxy">
    Route Bedrock traffic through your corporate proxy by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Bedrock
    export CLAUDE_CODE_USE_BEDROCK=1
    export AWS_REGION=us-east-1

    # Configure corporate proxy
    export HTTPS_PROXY='https://proxy.example.com:8080'
    ```
  </Tab>

  <Tab title="LLM Gateway">
    Route Bedrock traffic through your LLM gateway by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Bedrock
    export CLAUDE_CODE_USE_BEDROCK=1

    # Configure LLM gateway
    export ANTHROPIC_BEDROCK_BASE_URL='https://your-llm-gateway.com/bedrock'
    export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1  # If gateway handles AWS auth
    ```
  </Tab>
</Tabs>

### Microsoft Foundry

<Tabs>
  <Tab title="Corporate proxy">
    Route Foundry traffic through your corporate proxy by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Microsoft Foundry
    export CLAUDE_CODE_USE_FOUNDRY=1
    export ANTHROPIC_FOUNDRY_RESOURCE=your-resource
    export ANTHROPIC_FOUNDRY_API_KEY=your-api-key  # Or omit for Entra ID auth

    # Configure corporate proxy
    export HTTPS_PROXY='https://proxy.example.com:8080'
    ```
  </Tab>

  <Tab title="LLM Gateway">
    Route Foundry traffic through your LLM gateway by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Microsoft Foundry
    export CLAUDE_CODE_USE_FOUNDRY=1

    # Configure LLM gateway
    export ANTHROPIC_FOUNDRY_BASE_URL='https://your-llm-gateway.com'
    export CLAUDE_CODE_SKIP_FOUNDRY_AUTH=1  # If gateway handles Azure auth
    ```
  </Tab>
</Tabs>

### Google Vertex AI

<Tabs>
  <Tab title="Corporate proxy">
    Route Vertex AI traffic through your corporate proxy by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Vertex
    export CLAUDE_CODE_USE_VERTEX=1
    export CLOUD_ML_REGION=us-east5
    export ANTHROPIC_VERTEX_PROJECT_ID=your-project-id

    # Configure corporate proxy
    export HTTPS_PROXY='https://proxy.example.com:8080'
    ```
  </Tab>

  <Tab title="LLM Gateway">
    Route Vertex AI traffic through your LLM gateway by setting the following [environment variables](/docs/en/env-vars):

    ```bash theme={null}
    # Enable Vertex
    export CLAUDE_CODE_USE_VERTEX=1

    # Configure LLM gateway
    export ANTHROPIC_VERTEX_BASE_URL='https://your-llm-gateway.com/vertex'
    export CLAUDE_CODE_SKIP_VERTEX_AUTH=1  # If gateway handles GCP auth
    ```
  </Tab>
</Tabs>

<Tip>
  Use `/status` in Claude Code to verify your proxy and gateway configuration is applied correctly.
</Tip>

## Best practices for organizations

### Invest in documentation and memory

We strongly recommend investing in documentation so that Claude Code understands your codebase. Organizations can deploy CLAUDE.md files at multiple levels:

* **Organization-wide**: Deploy to system directories like `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) for company-wide standards
* **Repository-level**: Create `CLAUDE.md` files in repository roots containing project architecture, build commands, and contribution guidelines. Check these into source control so all users benefit

Learn more in [Memory and CLAUDE.md files](/docs/en/memory).

### Simplify deployment

If you have a custom development environment, we find that creating a "one click" way to install Claude Code is key to growing adoption across an organization.

### Start with guided usage

Encourage new users to try Claude Code for codebase Q\&A, or on smaller bug fixes or feature requests. Ask Claude Code to make a plan. Check Claude's suggestions and give feedback if it's off-track. Over time, as users understand this new paradigm better, then they'll be more effective at letting Claude Code run more agentically.

### Pin model versions for cloud providers

If you deploy through [Bedrock](/docs/en/amazon-bedrock), [Vertex AI](/docs/en/google-vertex-ai), [Foundry](/docs/en/microsoft-foundry), or [Claude Platform on AWS](/docs/en/claude-platform-on-aws), pin specific model versions using `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, and `ANTHROPIC_DEFAULT_HAIKU_MODEL`. Without pinning, model aliases resolve to the latest version, which may not yet be enabled in your account when Anthropic releases an update. Pinning lets you control when your users move to a new model. See [Model configuration](/docs/en/model-config#pin-models-for-third-party-deployments) for what each provider does when the latest version is unavailable.

### Configure security policies

Security teams can configure managed permissions for what Claude Code is and is not allowed to do, which cannot be overwritten by local configuration. [Learn more](/docs/en/security).

### Leverage MCP for integrations

MCP is a great way to give Claude Code more information, such as connecting to ticket management systems or error logs. We recommend that one central team configures MCP servers and checks a `.mcp.json` configuration into the codebase so that all users benefit. [Learn more](/docs/en/mcp).

At Anthropic, we trust Claude Code to power development across every Anthropic codebase. We hope you enjoy using Claude Code as much as we do.

## Next steps

Once you've chosen a deployment option and configured access for your team:

1. **Roll out to your team**: Share installation instructions and have team members [install Claude Code](/docs/en/setup) and authenticate with their credentials.
2. **Set up shared configuration**: Create a [CLAUDE.md file](/docs/en/memory) in your repositories to help Claude Code understand your codebase and coding standards.
3. **Configure permissions**: Review [security settings](/docs/en/security) to define what Claude Code can and cannot do in your environment.


---

## Claude Code on Amazon Bedrock

`https://code.claude.com/docs/en/amazon-bedrock`

Learn about configuring Claude Code through Amazon Bedrock, including setup, IAM configuration, and troubleshooting.

<ContactSalesCard />

## Prerequisites

Before configuring Claude Code with Bedrock, ensure you have:

* An AWS account with Bedrock access enabled
* Access to desired Claude models (for example, Claude Sonnet 4.6) in Bedrock
* AWS CLI installed and configured (optional - only needed if you don't have another mechanism for getting credentials)
* Appropriate IAM permissions

To sign in with your own Bedrock credentials, follow [Sign in with Bedrock](#sign-in-with-bedrock) below. To deploy Claude Code across a team, use the [manual setup](#set-up-manually) steps and [pin your model versions](#4-pin-model-versions) before rolling out.

## Sign in with Bedrock

If you have AWS credentials and want to start using Claude Code through Bedrock, the login wizard walks you through it. You complete the AWS-side prerequisites once per account; the wizard handles the Claude Code side.

<Steps>
  <Step title="Enable Anthropic models in your AWS account">
    In the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/), open the Model catalog, select an Anthropic model, and submit the use case form. Access is granted immediately after submission. See [Submit use case details](#1-submit-use-case-details) for AWS Organizations and [IAM configuration](#iam-configuration) for the permissions your role needs.
  </Step>

  <Step title="Start Claude Code and choose Bedrock">
    Run `claude`. At the login prompt, select **3rd-party platform**, then **Amazon Bedrock**.
  </Step>

  <Step title="Follow the wizard prompts">
    Choose how you authenticate to AWS: an AWS profile detected from your `~/.aws` directory, a Bedrock API key, an access key and secret, or credentials already in your environment. The wizard picks up your region, verifies which Claude models your account can invoke, and lets you pin them. It saves the result to the `env` block of your [user settings file](/docs/en/settings), so you don't need to export environment variables yourself.
  </Step>
</Steps>

After you've signed in, run `/setup-bedrock` any time to reopen the wizard and change your credentials, region, or model pins.

## Set up manually

To configure Bedrock through environment variables instead of the wizard, for example in CI or a scripted enterprise rollout, follow the steps below.

### 1. Submit use case details

First-time users of Anthropic models are required to submit use case details before invoking a model. This is done once per AWS account.

1. Ensure you have the right IAM permissions described below
2. Navigate to the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/)
3. Select an Anthropic model from the **Model catalog**
4. Complete the use case form. Access is granted immediately after submission.

If you use AWS Organizations, you can submit the form once from the management account using the [`PutUseCaseForModelAccess` API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_PutUseCaseForModelAccess.html). This call requires the `bedrock:PutUseCaseForModelAccess` IAM permission. Approval extends to child accounts automatically.

### 2. Configure AWS credentials

Claude Code uses the default AWS SDK credential chain. Set up your credentials using one of these methods:

**Option A: AWS CLI configuration**

```bash theme={null}
aws configure
```

**Option B: Environment variables (access key)**

```bash theme={null}
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_SESSION_TOKEN=your-session-token
```

**Option C: Environment variables (SSO profile)**

```bash theme={null}
aws sso login --profile=<your-profile-name>

export AWS_PROFILE=your-profile-name
```

**Option D: AWS Management Console credentials**

```bash theme={null}
aws login
```

[Learn more](https://docs.aws.amazon.com/signin/latest/userguide/command-line-sign-in.html) about `aws login`.

**Option E: Bedrock API keys**

```bash theme={null}
export AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
```

Bedrock API keys provide a simpler authentication method without needing full AWS credentials. [Learn more about Bedrock API keys](https://aws.amazon.com/blogs/machine-learning/accelerate-ai-development-with-amazon-bedrock-api-keys/).

#### Advanced credential configuration

Claude Code supports automatic credential refresh for AWS SSO and corporate identity providers. Add these settings to your Claude Code settings file (see [Settings](/docs/en/settings) for file locations).

These two settings have different trigger conditions:

* **`awsAuthRefresh`**: runs only when Claude Code detects that your AWS credentials are expired, either locally based on their timestamp or when Bedrock returns a credential error, then retries the request with refreshed credentials.
* **`awsCredentialExport`**: runs at session start and on each credential reload, even when the credentials in your AWS default credential provider chain are still valid. Use this when your Bedrock account requires cross-account credentials that differ from the ones the default provider chain would resolve.

##### Example configuration

```json theme={null}
{
  "awsAuthRefresh": "aws sso login --profile myprofile",
  "env": {
    "AWS_PROFILE": "myprofile"
  }
}
```

##### Configuration settings explained

**`awsAuthRefresh`**: Use this for commands that modify the `.aws` directory, such as updating credentials, SSO cache, or config files. The command's output is displayed to the user, but interactive input isn't supported. This works well for browser-based SSO flows where the CLI displays a URL or code and you complete authentication in the browser.

**`awsCredentialExport`**: Only use this if you can't modify `.aws` and must directly return credentials. This command runs whenever credentials need to be refreshed, not only when credentials are expired. Output is captured silently and not shown to the user. The command must output JSON in this format:

```json theme={null}
{
  "Credentials": {
    "AccessKeyId": "value",
    "SecretAccessKey": "value",
    "SessionToken": "value"
  }
}
```

### 3. Configure Claude Code

Set the following environment variables to enable Bedrock:

```bash theme={null}
# Enable Bedrock integration
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1  # or your preferred region

# Optional: Override the AWS region for the small/fast model (Bedrock and Mantle).
# On Bedrock, has no effect without ANTHROPIC_DEFAULT_HAIKU_MODEL
# or the deprecated ANTHROPIC_SMALL_FAST_MODEL set.
export ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION=us-west-2

# Optional: Override the Bedrock endpoint URL for custom endpoints or gateways
# export ANTHROPIC_BEDROCK_BASE_URL=https://bedrock-runtime.us-east-1.amazonaws.com
```

When enabling Bedrock for Claude Code, keep the following in mind:

* `AWS_REGION` is a required environment variable. Claude Code does not read from the `.aws` config file for this setting.
* When using Bedrock, the `/logout` command is unavailable since authentication is handled through AWS credentials.
* You can use settings files for environment variables like `AWS_PROFILE` that you don't want to leak to other processes. See [Settings](/docs/en/settings) for more information.

### 4. Pin model versions

<Warning>
  Pin specific model versions when deploying to multiple users. Without pinning, model aliases such as `sonnet` and `opus` resolve to the latest version, which may not yet be available in your Bedrock account when Anthropic releases an update. Claude Code [falls back](#startup-model-checks) to the previous version at startup when the latest is unavailable, but pinning lets you control when your users move to a new model.
</Warning>

Set these environment variables to specific Bedrock model IDs.

Without `ANTHROPIC_DEFAULT_OPUS_MODEL`, the `opus` alias on Bedrock resolves to Opus 4.6. Set it to the Opus 4.8 ID to use the latest model:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL='us.anthropic.claude-opus-4-8'
export ANTHROPIC_DEFAULT_SONNET_MODEL='us.anthropic.claude-sonnet-4-6'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'
```

These variables use cross-region inference profile IDs (with the `us.` prefix). If you use a different region prefix or application inference profiles, adjust accordingly. For current and legacy model IDs, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). See [Model configuration](/docs/en/model-config#pin-models-for-third-party-deployments) for the full list of environment variables.

Claude Code uses these default models when no pinning variables are set:

| Model type       | Default value                                  |
| :--------------- | :--------------------------------------------- |
| Primary model    | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| Small/fast model | Same as primary model                          |

Background tasks such as session title generation use the small/fast model, normally a Haiku-class model. On Bedrock, Claude Code defaults this to the primary model because Haiku may not be enabled in every account or region. To use Haiku for background tasks, set `ANTHROPIC_DEFAULT_HAIKU_MODEL` to a model ID that is available in your account.

To customize models further, use one of these methods:

```bash theme={null}
# Using inference profile ID
export ANTHROPIC_MODEL='us.anthropic.claude-sonnet-4-6'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='us.anthropic.claude-haiku-4-5-20251001-v1:0'

# Using application inference profile ARN
export ANTHROPIC_MODEL='arn:aws:bedrock:us-east-2:your-account-id:application-inference-profile/your-model-id'

# Optional: Disable prompt caching if needed
export DISABLE_PROMPT_CACHING=1

# Optional: Request 1-hour prompt cache TTL instead of the 5-minute default
export ENABLE_PROMPT_CACHING_1H=1
```

The 1-hour cache TTL is billed at a higher rate than the 5-minute default. See [cache lifetime](/docs/en/prompt-caching#cache-lifetime).

<Note>Prompt caching may not be available in all Bedrock regions. If cache token counts stay at zero, check [supported models, regions, and limits](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html#prompt-caching-models) in the Bedrock documentation.</Note>

#### Map each model version to an inference profile

The `ANTHROPIC_DEFAULT_*_MODEL` environment variables configure one inference profile per model family. If your organization needs to expose several versions of the same family in the `/model` picker, each routed to its own application inference profile ARN, use the `modelOverrides` setting in your [settings file](/docs/en/settings#settings-files) instead.

This example maps four Opus versions to distinct ARNs so users can switch between them without bypassing your organization's inference profiles:

```json theme={null}
{
  "modelOverrides": {
    "claude-opus-4-7": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-47-prod",
    "claude-opus-4-6": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-46-prod",
    "claude-opus-4-5-20251101": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-45-prod",
    "claude-opus-4-1-20250805": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-41-prod"
  }
}
```

When a user selects one of these versions in `/model`, Claude Code calls Bedrock with the mapped ARN. Versions without an override fall back to the built-in Bedrock model ID or any matching inference profile discovered at startup. See [Override model IDs per version](/docs/en/model-config#override-model-ids-per-version) for details on how overrides interact with `availableModels` and other model settings.

## Startup model checks

When Claude Code starts with Bedrock configured, it verifies that the models it intends to use are accessible in your account. This check requires Claude Code v2.1.94 or later.

If you have pinned a model version that is older than the current Claude Code default, and your account can invoke the newer version, Claude Code prompts you to update the pin. Accepting writes the new model ID to your [user settings file](/docs/en/settings) and restarts Claude Code. Declining is remembered until the next default version change. Pins that point to an [application inference profile ARN](#map-each-model-version-to-an-inference-profile) are skipped, since those are managed by your administrator.

If you have not pinned a model and the current default is unavailable in your account, Claude Code falls back to the previous version for the current session and shows a notice. The fallback is not persisted. Enable the newer model in your Bedrock account or [pin a version](#4-pin-model-versions) to make the choice permanent.

## IAM configuration

Create an IAM policy with the required permissions for Claude Code:

```json theme={null}
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowModelAndInferenceProfileAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListInferenceProfiles",
        "bedrock:GetInferenceProfile"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*",
        "arn:aws:bedrock:*:*:foundation-model/*"
      ]
    },
    {
      "Sid": "AllowMarketplaceSubscription",
      "Effect": "Allow",
      "Action": [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:CalledViaLast": "bedrock.amazonaws.com"
        }
      }
    }
  ]
}
```

For more restrictive permissions, you can limit the Resource to specific inference profile ARNs.

`bedrock:GetInferenceProfile` lets Claude Code resolve an [application inference profile ARN](#map-each-model-version-to-an-inference-profile) to its backing foundation model, which is used to select the correct request shape for that model.

If the token is missing this permission, Claude Code recovers automatically by retrying once with the alternate shape, so requests still succeed but each new model adds an extra round-trip. Granting the permission avoids the retry. This applies most often to `AWS_BEARER_TOKEN_BEDROCK` deployments, where the token's policy is typically narrower than a full IAM role.

For details, see [Bedrock IAM documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html).

<Note>
  Create a dedicated AWS account for Claude Code to simplify cost tracking and access control.
</Note>

## 1M token context window

Claude Opus 4.6 and later, and Sonnet 4.6, support the [1M token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) on Amazon Bedrock. Claude Code automatically enables the extended context window when you select a 1M model variant.

The [setup wizard](#sign-in-with-bedrock) offers a 1M context option when it pins models. To enable it for a manually pinned model instead, append `[1m]` to the model ID. See [Pin models for third-party deployments](/docs/en/model-config#pin-models-for-third-party-deployments) for details.

## Service tiers

[Amazon Bedrock service tiers](https://docs.aws.amazon.com/bedrock/latest/userguide/service-tiers-inference.html) let you trade off cost against latency. Set `ANTHROPIC_BEDROCK_SERVICE_TIER` to `default`, `flex`, or `priority`:

```bash theme={null}
export ANTHROPIC_BEDROCK_SERVICE_TIER=priority
```

Claude Code sends this as the `X-Amzn-Bedrock-Service-Tier` header on each request. Tier availability varies by model and region. Reserved capacity uses a [provisioned throughput](https://docs.aws.amazon.com/bedrock/latest/userguide/prov-throughput.html) ARN as the model ID instead of this setting.

## AWS Guardrails

[Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) let you implement content filtering for Claude Code. Create a Guardrail in the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock/), publish a version, then add the Guardrail headers to your [settings file](/docs/en/settings). Enable Cross-Region inference on your Guardrail if you're using cross-region inference profiles.

Example configuration:

```json theme={null}
{
  "env": {
    "ANTHROPIC_CUSTOM_HEADERS": "X-Amzn-Bedrock-GuardrailIdentifier: your-guardrail-id\nX-Amzn-Bedrock-GuardrailVersion: 1"
  }
}
```

## Use the Mantle endpoint

Mantle is an Amazon Bedrock endpoint that serves Claude models through the native Anthropic API shape rather than the Bedrock Invoke API. It uses the same AWS credentials, IAM permissions, and `awsAuthRefresh` configuration described earlier on this page.

<Note>
  Mantle requires Claude Code v2.1.94 or later. Run `claude --version` to check.
</Note>

### Enable Mantle

With AWS credentials already configured, set `CLAUDE_CODE_USE_MANTLE` to route requests to the Mantle endpoint:

```bash theme={null}
export CLAUDE_CODE_USE_MANTLE=1
export AWS_REGION=us-east-1
```

Claude Code constructs the endpoint URL from `AWS_REGION`. To override it for a custom endpoint or gateway, set `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`.

Run `/status` inside Claude Code to confirm. The provider line shows `Amazon Bedrock (Mantle)` when Mantle is active.

### Select a Mantle model

Mantle uses model IDs prefixed with `anthropic.` and without a version suffix, for example `anthropic.claude-haiku-4-5`. The models available to your account depend on what your organization has been granted; additional model IDs are listed in your onboarding materials from AWS. Contact your AWS account team to request access to allowlisted models.

Set the model with the `--model` flag or with `/model` inside Claude Code:

```bash theme={null}
claude --model anthropic.claude-haiku-4-5
```

### Run Mantle alongside the Invoke API

The models available to you on Mantle may not include every model you use today. Setting both `CLAUDE_CODE_USE_BEDROCK` and `CLAUDE_CODE_USE_MANTLE` lets Claude Code call both endpoints from the same session. Model IDs that match the Mantle format are routed to Mantle, and all other model IDs go to the Bedrock Invoke API.

```bash theme={null}
export CLAUDE_CODE_USE_BEDROCK=1
export CLAUDE_CODE_USE_MANTLE=1
```

To surface a Mantle model in the `/model` picker, list its ID in `availableModels` in your [settings file](/docs/en/settings). This setting also restricts the picker to the listed entries, so include every alias you want to keep available:

```json theme={null}
{
  "availableModels": ["opus", "sonnet", "haiku", "anthropic.claude-haiku-4-5"]
}
```

Entries with the `anthropic.` prefix are added as custom picker options and routed to Mantle. Replace `anthropic.claude-haiku-4-5` with the model ID your account has been granted. See [Restrict model selection](/docs/en/model-config#restrict-model-selection) for how `availableModels` interacts with other model settings.

When both providers are active, `/status` shows `Amazon Bedrock + Amazon Bedrock (Mantle)`.

### Route Mantle through a gateway

If your organization routes model traffic through a centralized [LLM gateway](/docs/en/llm-gateway) that injects AWS credentials server-side, disable client-side authentication so Claude Code sends requests without SigV4 signatures or `x-api-key` headers:

```bash theme={null}
export CLAUDE_CODE_USE_MANTLE=1
export CLAUDE_CODE_SKIP_MANTLE_AUTH=1
export ANTHROPIC_BEDROCK_MANTLE_BASE_URL=https://your-gateway.example.com
```

### Mantle environment variables

These variables are specific to the Mantle endpoint. See [Environment variables](/docs/en/env-vars) for the full list.

| Variable                                | Purpose                                                             |
| :-------------------------------------- | :------------------------------------------------------------------ |
| `CLAUDE_CODE_USE_MANTLE`                | Enable the Mantle endpoint. Set to `1` or `true`.                   |
| `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`     | Override the default Mantle endpoint URL                            |
| `CLAUDE_CODE_SKIP_MANTLE_AUTH`          | Skip client-side authentication for proxy setups                    |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION` | Override AWS region for the Haiku-class model (shared with Bedrock) |

## Troubleshooting

### Authentication loop with SSO and corporate proxies

If browser tabs spawn repeatedly when using AWS SSO, remove the `awsAuthRefresh` setting from your [settings file](/docs/en/settings). This can occur when corporate VPNs or TLS inspection proxies interrupt the SSO browser flow. Claude Code treats the interrupted connection as an authentication failure, re-runs `awsAuthRefresh`, and loops indefinitely.

If your network environment interferes with automatic browser-based SSO flows, use `aws sso login` manually before starting Claude Code instead of relying on `awsAuthRefresh`.

### Region issues

If you encounter region issues:

* Check model availability: `aws bedrock list-inference-profiles --region your-region`
* Switch to a supported region: `export AWS_REGION=us-east-1`
* Consider using inference profiles for cross-region access

If you receive an error "on-demand throughput isn't supported":

* Specify the model as an [inference profile](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html) ID

Claude Code uses the Bedrock [Invoke API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModelWithResponseStream.html) and does not support the Converse API.

### Mantle endpoint errors

If `/status` does not show `Amazon Bedrock (Mantle)` after you set `CLAUDE_CODE_USE_MANTLE`, the variable is not reaching the process. Confirm it is exported in the shell where you launched `claude`, or set it in the `env` block of your [settings file](/docs/en/settings).

A `403` from the Mantle endpoint with valid credentials means your AWS account has not been granted access to the model you requested. Contact your AWS account team to request access.

A `400` that names the model ID means that model is not served on Mantle. Mantle has its own model lineup separate from the standard Bedrock catalog, so inference profile IDs such as `us.anthropic.claude-sonnet-4-6` will not work. Use a Mantle-format ID, or enable [both endpoints](#run-mantle-alongside-the-invoke-api) so Claude Code routes each request to the endpoint where the model is available.

## Additional resources

* [Bedrock documentation](https://docs.aws.amazon.com/bedrock/)
* [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)
* [Bedrock inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
* [Bedrock token burndown and quotas](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas-token-burndown.html)
* [Claude Code on Amazon Bedrock: Quick Setup Guide](https://community.aws/content/2tXkZKrZzlrlu0KfH8gST5Dkppq/claude-code-on-amazon-bedrock-quick-setup-guide)
* [Claude Code Monitoring Implementation (Bedrock)](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md)


---

## Claude Code on Google Vertex AI

`https://code.claude.com/docs/en/google-vertex-ai`

Learn about configuring Claude Code through Google Vertex AI, including setup, IAM configuration, and troubleshooting.

<ContactSalesCard />

## Prerequisites

Before configuring Claude Code with Vertex AI, ensure you have:

* A Google Cloud Platform (GCP) account with billing enabled
* A GCP project with Vertex AI API enabled
* Access to desired Claude models (for example, Claude Sonnet 4.6)
* Google Cloud SDK (`gcloud`) installed and configured
* Quota allocated in desired GCP region

To sign in with your own Vertex AI credentials, follow [Sign in with Vertex AI](#sign-in-with-vertex-ai) below. To deploy Claude Code across a team, use the [manual setup](#set-up-manually) steps and [pin your model versions](#5-pin-model-versions) before rolling out.

## Sign in with Vertex AI

If you have Google Cloud credentials and want to start using Claude Code through Vertex AI, the login wizard walks you through it. You complete the GCP-side prerequisites once per project; the wizard handles the Claude Code side.

<Note>
  The Vertex AI setup wizard requires Claude Code v2.1.98 or later. Run `claude --version` to check.
</Note>

<Steps>
  <Step title="Enable Claude models in your GCP project">
    [Enable the Vertex AI API](#1-enable-vertex-ai-api) for your project, then request access to the Claude models you want in the [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden). See [IAM configuration](#iam-configuration) for the permissions your account needs.
  </Step>

  <Step title="Start Claude Code and choose Vertex AI">
    Run `claude`. At the login prompt, select **3rd-party platform**, then **Google Vertex AI**.
  </Step>

  <Step title="Follow the wizard prompts">
    Choose how you authenticate to Google Cloud: Application Default Credentials from `gcloud`, a service account key file, or credentials already in your environment. The wizard detects your project and region, verifies which Claude models your project can invoke, and lets you pin them. It saves the result to the `env` block of your [user settings file](/docs/en/settings), so you don't need to export environment variables yourself.
  </Step>
</Steps>

After you've signed in, run `/setup-vertex` any time to reopen the wizard and change your credentials, project, region, or model pins.

## Region configuration

Claude Code supports Vertex AI [global](https://cloud.google.com/blog/products/ai-machine-learning/global-endpoint-for-claude-models-generally-available-on-vertex-ai), multi-region, and regional endpoints. Set `CLOUD_ML_REGION` to `global`, a multi-region location such as `eu` or `us`, or a specific region such as `us-east5`. Claude Code selects the correct Vertex AI hostname for each form, including the `aiplatform.eu.rep.googleapis.com` and `aiplatform.us.rep.googleapis.com` hosts for multi-region locations.

<Note>
  Vertex AI may not support the Claude Code default models on every endpoint type. Model availability varies across [specific regions](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations#genai-partner-models), multi-region locations, and [global endpoints](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-partner-models#supported_models). You may need to switch to a supported location or specify a supported model.
</Note>

## Set up manually

To configure Vertex AI through environment variables instead of the wizard, for example in CI or a scripted enterprise rollout, follow the steps below.

### 1. Enable Vertex AI API

Enable the Vertex AI API in your GCP project:

```bash theme={null}
# Set your project ID
gcloud config set project YOUR-PROJECT-ID

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com
```

### 2. Request model access

Request access to Claude models in Vertex AI:

1. Navigate to the [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
2. Search for "Claude" models
3. Request access to desired Claude models (for example, Claude Sonnet 4.6)
4. Wait for approval (may take 24-48 hours)

### 3. Configure GCP credentials

Claude Code uses standard Google Cloud authentication.

For more information, see [Google Cloud authentication documentation](https://cloud.google.com/docs/authentication).

Claude Code v2.1.121 or later supports [X.509 certificate-based Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-with-x509-certificates) through the same Application Default Credentials chain. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your credential configuration file.

<Note>
  Claude Code uses `ANTHROPIC_VERTEX_PROJECT_ID` as the project ID for Vertex AI requests. The `GCLOUD_PROJECT` and `GOOGLE_CLOUD_PROJECT` environment variables and the credential file referenced by `GOOGLE_APPLICATION_CREDENTIALS` take precedence over it. If none of these are set, the project ID is resolved from your `gcloud` configuration or the attached service account.
</Note>

#### Advanced credential configuration

Claude Code supports automatic credential refresh for GCP through the `gcpAuthRefresh` setting. When Claude Code detects that your GCP credentials are expired or cannot be loaded, it runs the configured command to obtain new credentials before retrying the request.

```json theme={null}
{
  "gcpAuthRefresh": "gcloud auth application-default login",
  "env": {
    "ANTHROPIC_VERTEX_PROJECT_ID": "your-project-id"
  }
}
```

The command's output is displayed to the user, but interactive input isn't supported. This works well for browser-based authentication flows where the CLI shows a URL and you complete authentication in the browser. The refresh command times out after three minutes if authentication does not complete. If you set `gcpAuthRefresh` in project settings such as `.claude/settings.json`, the command runs only after you accept the workspace trust prompt.

### 4. Configure Claude Code

Set the following environment variables:

```bash theme={null}
# Enable Vertex AI integration
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=global
export ANTHROPIC_VERTEX_PROJECT_ID=YOUR-PROJECT-ID

# Optional: Override the Vertex endpoint URL for custom endpoints or gateways
# export ANTHROPIC_VERTEX_BASE_URL=https://aiplatform.googleapis.com

# Optional: Disable prompt caching if needed
export DISABLE_PROMPT_CACHING=1

# Optional: Request 1-hour prompt cache TTL instead of the 5-minute default
export ENABLE_PROMPT_CACHING_1H=1

# When CLOUD_ML_REGION=global, override region for models that don't support global endpoints
export VERTEX_REGION_CLAUDE_HAIKU_4_5=us-east5
export VERTEX_REGION_CLAUDE_4_6_SONNET=europe-west1
```

Most model versions have a corresponding `VERTEX_REGION_CLAUDE_*` variable. See the [Environment variables reference](/docs/en/env-vars) for the full list. Check [Vertex Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) to determine which models support global endpoints versus regional only.

[Prompt caching](/docs/en/prompt-caching) is enabled automatically. To disable it, set `DISABLE_PROMPT_CACHING=1`. To request a 1-hour cache TTL instead of the 5-minute default, set `ENABLE_PROMPT_CACHING_1H=1`; cache writes with a 1-hour TTL are billed at a higher rate. For heightened rate limits, contact Google Cloud support. When using Vertex AI, the `/logout` command is unavailable since authentication is handled through Google Cloud credentials.

Claude Code disables [MCP tool search](/docs/en/mcp#scale-with-mcp-tool-search) by default on Vertex AI, so MCP tool definitions load upfront. Vertex AI supports tool search for Claude Sonnet 4.5 and later and Claude Opus 4.5 and later. Set `ENABLE_TOOL_SEARCH=true` to enable it on those models. Earlier models on Vertex AI do not accept the required beta header, and requests fail if you enable tool search with them.

### 5. Pin model versions

<Warning>
  Pin specific model versions when deploying to multiple users. Without pinning, model aliases such as `sonnet` and `opus` resolve to the latest version, which may not yet be enabled in your Vertex AI project when Anthropic releases an update. Claude Code [falls back](#startup-model-checks) to the previous version at startup when the latest is unavailable, but pinning lets you control when your users move to a new model.
</Warning>

Set these environment variables to specific Vertex AI model IDs.

Without `ANTHROPIC_DEFAULT_OPUS_MODEL`, the `opus` alias on Vertex resolves to Opus 4.6. Set it to the Opus 4.8 ID to use the latest model:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-8'
export ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-4-6'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-haiku-4-5@20251001'
```

For current and legacy model IDs, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). See [Model configuration](/docs/en/model-config#pin-models-for-third-party-deployments) for the full list of environment variables.

Claude Code uses these default models when no pinning variables are set:

| Model type       | Default value                |
| :--------------- | :--------------------------- |
| Primary model    | `claude-sonnet-4-5@20250929` |
| Small/fast model | Same as primary model        |

Background tasks such as session title generation use the small/fast model, normally a Haiku-class model. On Vertex AI, Claude Code defaults this to the primary model because Haiku may not be enabled in every project or region. To use Haiku for background tasks, set `ANTHROPIC_DEFAULT_HAIKU_MODEL` to a model ID that is available in your project.

To customize models further:

```bash theme={null}
export ANTHROPIC_MODEL='claude-opus-4-8'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-haiku-4-5@20251001'
```

## Startup model checks

When Claude Code starts with Vertex AI configured, it verifies that the models it intends to use are accessible in your project. This check requires Claude Code v2.1.98 or later.

If you have pinned a model version that is older than the current Claude Code default, and your project can invoke the newer version, Claude Code prompts you to update the pin. Accepting writes the new model ID to your [user settings file](/docs/en/settings) and restarts Claude Code. Declining is remembered until the next default version change.

If you have not pinned a model and the current default is unavailable in your project, Claude Code falls back to the previous version for the current session and shows a notice. The fallback is not persisted. Enable the newer model in [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) or [pin a version](#5-pin-model-versions) to make the choice permanent.

## IAM configuration

Assign the required IAM permissions:

The `roles/aiplatform.user` role includes the required permissions:

* `aiplatform.endpoints.predict` - Required for model invocation and token counting

For more restrictive permissions, create a custom role with only the permissions above.

For details, see [Vertex IAM documentation](https://cloud.google.com/vertex-ai/docs/general/access-control).

<Note>
  Create a dedicated GCP project for Claude Code to simplify cost tracking and access control.
</Note>

## 1M token context window

Claude Opus 4.6 and later, and Sonnet 4.6, support the [1M token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) on Vertex AI. Claude Code automatically enables the extended context window when you select a 1M model variant.

The [setup wizard](#sign-in-with-vertex-ai) offers a 1M context option when it pins models. To enable it for a manually pinned model instead, append `[1m]` to the model ID. See [Pin models for third-party deployments](/docs/en/model-config#pin-models-for-third-party-deployments) for details.

## Troubleshooting

If you encounter "Could not load the default credentials" errors:

* Run `gcloud auth application-default login` to set up Application Default Credentials
* Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key file path
* See [Configure GCP credentials](#3-configure-gcp-credentials) for all options

If you encounter quota issues:

* Check current quotas or request quota increase through [Cloud Console](https://cloud.google.com/docs/quotas/view-manage)

If you encounter "model not found" 404 errors:

* Confirm model is Enabled in [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
* Verify the model is available in the location you specified. Some models are offered only on `global` or multi-region locations such as `eu` and `us`, not in specific regions
* If using `CLOUD_ML_REGION=global`, check that your models support global endpoints in [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) under "Supported features". For models that don't support global endpoints, either:
  * Specify a supported model via `ANTHROPIC_MODEL` or `ANTHROPIC_DEFAULT_HAIKU_MODEL`, or
  * Set a region or multi-region location using `VERTEX_REGION_<MODEL_NAME>` environment variables

If you encounter 429 errors:

* For regional endpoints, ensure the primary model and small/fast model are supported in your selected region
* Consider switching to `CLOUD_ML_REGION=global` for better availability

## Additional resources

* [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs)
* [Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing)
* [Vertex AI quotas and limits](https://cloud.google.com/vertex-ai/docs/quotas)


---

## Claude Code on Microsoft Foundry

`https://code.claude.com/docs/en/microsoft-foundry`

Learn about configuring Claude Code through Microsoft Foundry, including setup, configuration, and troubleshooting.

<ContactSalesCard />

## Prerequisites

Before configuring Claude Code with Microsoft Foundry, ensure you have:

* An Azure subscription with access to Microsoft Foundry
* RBAC permissions to create Microsoft Foundry resources and deployments
* Azure CLI installed and configured (optional - only needed if you don't have another mechanism for getting credentials)

<Note>
  If you are deploying Claude Code to multiple users, [pin your model versions](#4-pin-model-versions) to prevent breakage when Anthropic releases new models.
</Note>

## Setup

### 1. Provision Microsoft Foundry resource

First, create a Claude resource in Azure:

1. Navigate to the [Microsoft Foundry portal](https://ai.azure.com/)
2. Create a new resource, noting your resource name
3. Create deployments for the Claude models:
   * Claude Opus
   * Claude Sonnet
   * Claude Haiku

### 2. Configure Azure credentials

Claude Code supports two authentication methods for Microsoft Foundry. Choose the method that best fits your security requirements.

**Option A: API key authentication**

1. Navigate to your resource in the Microsoft Foundry portal
2. Go to the **Endpoints and keys** section
3. Copy **API Key**
4. Set the environment variable:

```bash theme={null}
export ANTHROPIC_FOUNDRY_API_KEY=your-azure-api-key
```

**Option B: Microsoft Entra ID authentication**

When `ANTHROPIC_FOUNDRY_API_KEY` is not set, Claude Code automatically uses the Azure SDK [default credential chain](https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/credential-chains#defaultazurecredential-overview).
This supports a variety of methods for authenticating local and remote workloads.

On local environments, you commonly may use the Azure CLI:

```bash theme={null}
az login
```

<Note>
  When using Microsoft Foundry, the `/logout` command is unavailable since authentication is handled through Azure credentials.
</Note>

### 3. Configure Claude Code

Set the following environment variables to enable Microsoft Foundry:

```bash theme={null}
# Enable Microsoft Foundry integration
export CLAUDE_CODE_USE_FOUNDRY=1

# Azure resource name (replace {resource} with your resource name)
export ANTHROPIC_FOUNDRY_RESOURCE={resource}
# Or provide the full base URL:
# export ANTHROPIC_FOUNDRY_BASE_URL=https://{resource}.services.ai.azure.com/anthropic
```

### 4. Pin model versions

<Warning>
  Pin specific model versions for every deployment. If you use model aliases (`sonnet`, `opus`, `haiku`) without pinning, Claude Code may attempt to use a newer model version that isn't available in your Foundry account, breaking existing users when Anthropic releases updates. When you create Azure deployments, select a specific model version rather than "auto-update to latest."
</Warning>

Set the model variables to match the deployment names you created in step 1.

Without `ANTHROPIC_DEFAULT_OPUS_MODEL`, the `opus` alias on Foundry resolves to Opus 4.6. Set it to the Opus 4.8 ID to use the latest model:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-8'
export ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-4-6'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-haiku-4-5'
```

Background tasks such as session title generation use the small/fast model, normally a Haiku-class model. On Foundry, Claude Code defaults this to the primary model because not every account has a Haiku deployment. To use Haiku for background tasks, set `ANTHROPIC_DEFAULT_HAIKU_MODEL` to a Haiku deployment that is available in your account, as shown above.

For current and legacy model IDs, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). See [Model configuration](/docs/en/model-config#pin-models-for-third-party-deployments) for the full list of environment variables.

[Prompt caching](/docs/en/prompt-caching) is enabled automatically. To request a 1-hour cache TTL instead of the 5-minute default, set the following variable; cache writes with a 1-hour TTL are billed at a higher rate:

```bash theme={null}
export ENABLE_PROMPT_CACHING_1H=1
```

### 5. Run Claude Code

With the environment variables set, start Claude Code from your project directory:

```bash theme={null}
claude
```

Claude Code reads `CLAUDE_CODE_USE_FOUNDRY` and the other Foundry variables from the environment and connects to your Azure resource on the first prompt. Unlike Bedrock and Vertex AI, Foundry has no interactive setup wizard, so the environment variables in steps 3 and 4 are the only configuration path.

## Azure RBAC configuration

The `Azure AI User` and `Cognitive Services User` default roles include all required permissions for invoking Claude models.

For more restrictive permissions, create a custom role with the following:

```json theme={null}
{
  "permissions": [
    {
      "dataActions": [
        "Microsoft.CognitiveServices/accounts/providers/*"
      ]
    }
  ]
}
```

For details, see [Microsoft Foundry RBAC documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/rbac-azure-ai-foundry).

## Troubleshooting

If you receive an error "Failed to get token from azureADTokenProvider: ChainedTokenCredential authentication failed":

* Configure Entra ID on the environment, or set `ANTHROPIC_FOUNDRY_API_KEY`.

## Additional resources

* [Microsoft Foundry documentation](https://learn.microsoft.com/en-us/azure/ai-foundry/what-is-azure-ai-foundry)
* [Microsoft Foundry models](https://ai.azure.com/explore/models)
* [Microsoft Foundry pricing](https://azure.microsoft.com/en-us/pricing/details/ai-foundry/)


---

## Claude Code on Claude Platform on AWS

`https://code.claude.com/docs/en/claude-platform-on-aws`

Configure Claude Code to use the Anthropic-operated Claude API with AWS authentication, IAM access control, and AWS Marketplace billing.

<Experiment />

Claude Platform on AWS is the Anthropic-operated Claude API with AWS authentication, IAM access control, and AWS Marketplace billing. Requests reach Anthropic's API directly, so you get the same models and features as the [Claude API](https://platform.claude.com/docs) on the same release schedule. You authenticate with AWS credentials or a workspace API key, and you pay through AWS Marketplace.

Use this guide to point Claude Code at a workspace you've already provisioned through Claude Platform on AWS. For the AWS subscription and workspace setup that comes before this, see the [Claude Platform on AWS documentation](https://platform.claude.com/docs/en/build-with-claude/claude-platform-on-aws).

<Note>
  Subscribing through AWS Marketplace provisions a new Anthropic organization tied to your AWS account. This organization is separate from any organization you already have with Anthropic, and credentials don't transfer between them. Use the workspace ID and API keys from the AWS-linked organization, not from a pre-existing Claude Console account.
</Note>

## Prerequisites

Before configuring Claude Code, you need:

* An active Claude Platform on AWS subscription through AWS Marketplace
* A workspace in your AWS-linked Anthropic organization, with its workspace ID
* An IAM principal with permission to invoke the Anthropic service, or an API key scoped to the workspace
* AWS credentials in your environment, in `~/.aws/credentials`, or from an attached IAM role if you want SigV4 authentication. The AWS CLI is required only for the SSO login flow.

## Setup

### 1. Configure AWS credentials

Claude Code supports two authentication methods for Claude Platform on AWS. Choose the method that fits how your team manages access.

**Option A: AWS credentials with SigV4**

Claude Code signs requests with SigV4 using the standard AWS credential chain: environment variables, shared credentials in `~/.aws/credentials`, IAM roles, AWS SSO sessions, and any other sources the AWS SDK supports.

For local use, log in with the AWS CLI before starting Claude Code. The example below uses an SSO profile, but any method that produces credentials in the standard locations works.

```bash theme={null}
aws sso login --profile my-profile
export AWS_PROFILE=my-profile
```

For CI and automation, give the runner an IAM role with permission to invoke the Anthropic service and set `AWS_REGION`. The credential chain picks the role up automatically.

If your SSO credentials expire mid-session, configure [`awsAuthRefresh`](/docs/en/amazon-bedrock#advanced-credential-configuration) so Claude Code re-runs your login command and retries instead of failing. Add the command to your `settings.json`:

```json theme={null}
{
  "awsAuthRefresh": "aws sso login --profile my-profile"
}
```

**Option B: Workspace API key**

A workspace API key is a long-lived secret, useful when you don't want to manage federated AWS credentials. Generate one in the AWS Console under **Claude Platform on AWS → API keys** and set it as `ANTHROPIC_AWS_API_KEY`:

```bash theme={null}
export ANTHROPIC_AWS_API_KEY=sk-ant-xxxxx
```

The key is sent as `x-api-key` and takes precedence over SigV4, so any AWS credentials in your environment are ignored. API keys from a separate Claude Console organization won't work here.

Treat workspace API keys like any other production credential. The [user settings file](/docs/en/settings) `env` block is a convenient way to scope the key to your machine without exporting it globally.

<Note>
  The `/login` and `/logout` commands don't change Claude Platform on AWS authentication. Authentication runs through your AWS credentials or workspace API key, not through a Claude.ai subscription.
</Note>

### 2. Configure Claude Code

Set the environment variables that route Claude Code through Claude Platform on AWS instead of the default Anthropic API.

```bash theme={null}
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
export ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_01ABCDEFGHIJKLMN
export AWS_REGION=us-east-1
```

`ANTHROPIC_AWS_WORKSPACE_ID` is required and is sent on every request as the `anthropic-workspace-id` header. The base URL is computed from `AWS_REGION` as `https://aws-external-anthropic.{region}.api.aws`. To override the URL directly, set `ANTHROPIC_AWS_BASE_URL`.

Claude Platform on AWS is opt-in even when AWS credentials are present in your environment. Bedrock and Foundry take precedence in provider routing, so unset `CLAUDE_CODE_USE_BEDROCK` and `CLAUDE_CODE_USE_FOUNDRY` if they're set.

### 3. Pin model versions

Claude Platform on AWS uses the same model IDs as the direct Claude API. The default aliases `opus`, `sonnet`, and `haiku` resolve to the latest versions available in your workspace.

If you deploy Claude Code to a team, pin the model IDs explicitly so a new release doesn't move everyone at once:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-7
export ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6
export ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5
```

For the full list of model IDs and aliases, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). For other model-related variables, see [Model configuration](/docs/en/model-config).

[Prompt caching](/docs/en/prompt-caching) is enabled automatically. To request a 1-hour cache TTL instead of the 5-minute default, set `ENABLE_PROMPT_CACHING_1H=1`. The API bills 1-hour cache writes at a higher rate. See [prompt caching pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing) for the rates.

## Use the Agent SDK

The [Agent SDK](/docs/en/agent-sdk/overview) reads the same environment variables as the CLI, so any program that spawns the Claude Code subprocess can target Claude Platform on AWS by exporting `CLAUDE_CODE_USE_ANTHROPIC_AWS`, `ANTHROPIC_AWS_WORKSPACE_ID`, and either `ANTHROPIC_AWS_API_KEY` or AWS credentials before the call.

```typescript theme={null}
import { query } from "@anthropic-ai/claude-agent-sdk";

process.env.CLAUDE_CODE_USE_ANTHROPIC_AWS = "1";
process.env.ANTHROPIC_AWS_WORKSPACE_ID = "wrkspc_01ABCDEFGHIJKLMN";
process.env.AWS_REGION = "us-east-1";

for await (const msg of query({ prompt: "What's in this repo?" })) {
  console.log(msg);
}
```

This example relies on the ambient AWS credential chain for SigV4. To authenticate with a workspace API key instead, set `ANTHROPIC_AWS_API_KEY` the same way. For the broader Agent SDK surface, see [Agent SDK overview](/docs/en/agent-sdk/overview).

## Route through a corporate proxy

To route traffic through a proxy or [LLM gateway](/docs/en/llm-gateway), set `ANTHROPIC_AWS_BASE_URL` to the proxy's address. Claude Code sends requests to that URL with the same workspace and authentication headers, so any gateway that forwards them unchanged works.

```bash theme={null}
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
export ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_01ABCDEFGHIJKLMN
export ANTHROPIC_AWS_BASE_URL=https://anthropic-proxy.example.com
```

If your gateway signs requests itself, set `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH=1` so Claude Code sends unsigned requests and lets the gateway add SigV4 headers before forwarding to AWS. If the gateway requires its own token, set it in `ANTHROPIC_AUTH_TOKEN`.

```bash theme={null}
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
export CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH=1
export ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_01ABCDEFGHIJKLMN
export ANTHROPIC_AWS_BASE_URL=https://anthropic-proxy.example.com
```

## Troubleshooting

Run `/status` to see the resolved provider and any explicitly configured workspace ID, region, base URL override, and auth-skip setting. This is the fastest way to confirm Claude Code is targeting Claude Platform on AWS at all.

### `403 Forbidden` or `AccessDenied` on every request

The IAM principal Claude Code resolved likely lacks permission to invoke the Anthropic service in your workspace. Check the role attached to your AWS profile or the runner that started Claude Code, and verify it has the `aws-external-anthropic` actions documented in the [IAM action reference](https://platform.claude.com/docs/en/api/claude-platform-on-aws-iam-actions).

If you set `ANTHROPIC_AWS_API_KEY`, the key takes precedence over SigV4 and a stale key produces the same error. Regenerate the key in the AWS Console under **Claude Platform on AWS → API keys** or unset the variable to fall back to your AWS credentials.

### Requests fail with a missing-workspace error

`ANTHROPIC_AWS_WORKSPACE_ID` is likely unset or empty. Every Claude Platform on AWS request must include the workspace ID. It is not implied by your AWS credentials. Find the ID under **Workspaces** on the AWS Console service page and export it before starting Claude Code.

### Requests still go to `api.anthropic.com`

`CLAUDE_CODE_USE_ANTHROPIC_AWS` is likely unset or set to a value that doesn't parse as truthy. Set it to `1` and run `/status` to confirm the resolved provider. If `CLAUDE_CODE_USE_BEDROCK` or `CLAUDE_CODE_USE_FOUNDRY` is also set, those take precedence over Claude Platform on AWS.

## Additional resources

The Claude Platform on AWS subscription, workspace, and IAM setup that comes before configuring Claude Code is covered in the platform documentation:

* [Claude Platform on AWS overview](https://platform.claude.com/docs/en/build-with-claude/claude-platform-on-aws): subscription, workspace setup, and product reference
* [IAM action reference](https://platform.claude.com/docs/en/api/claude-platform-on-aws-iam-actions): permissions and managed policies


---

## Enterprise network configuration

`https://code.claude.com/docs/en/network-config`

Configure Claude Code for enterprise environments with proxy servers, custom Certificate Authorities (CA), and mutual Transport Layer Security (mTLS) authentication.

Claude Code supports various enterprise network and security configurations through environment variables. This includes routing traffic through corporate proxy servers, trusting custom Certificate Authorities (CA), and authenticating with mutual Transport Layer Security (mTLS) certificates for enhanced security.

<Note>
  All environment variables shown on this page can also be configured in [`settings.json`](/docs/en/settings).
</Note>

## Proxy configuration

### Environment variables

Claude Code respects standard proxy environment variables:

```bash theme={null}
# HTTPS proxy (recommended)
export HTTPS_PROXY=https://proxy.example.com:8080

# HTTP proxy (if HTTPS not available)
export HTTP_PROXY=http://proxy.example.com:8080

# Bypass proxy for specific requests - space-separated format
export NO_PROXY="localhost 192.168.1.1 example.com .example.com"
# Bypass proxy for specific requests - comma-separated format
export NO_PROXY="localhost,192.168.1.1,example.com,.example.com"
# Bypass proxy for all requests
export NO_PROXY="*"
```

<Note>
  Claude Code does not support SOCKS proxies.
</Note>

### Basic authentication

If your proxy requires basic authentication, include credentials in the proxy URL:

```bash theme={null}
export HTTPS_PROXY=http://username:password@proxy.example.com:8080
```

<Warning>
  Avoid hardcoding passwords in scripts. Use environment variables or secure credential storage instead.
</Warning>

<Tip>
  For proxies requiring advanced authentication (NTLM, Kerberos, etc.), consider using an LLM Gateway service that supports your authentication method.
</Tip>

## CA certificate store

By default, Claude Code trusts both its bundled Mozilla CA certificates and your operating system's certificate store. Enterprise TLS-inspection proxies such as CrowdStrike Falcon and Zscaler work without additional configuration when their root certificate is installed in the OS trust store.

`CLAUDE_CODE_CERT_STORE` accepts a comma-separated list of sources. Recognized values are `bundled` for the Mozilla CA set shipped with Claude Code and `system` for the operating system trust store. The default is `bundled,system`.

To trust only the bundled Mozilla CA set:

```bash theme={null}
export CLAUDE_CODE_CERT_STORE=bundled
```

To trust only the OS certificate store:

```bash theme={null}
export CLAUDE_CODE_CERT_STORE=system
```

<Note>
  `CLAUDE_CODE_CERT_STORE` has no dedicated `settings.json` schema key. Set it via the `env` block in `~/.claude/settings.json` or directly in the process environment.
</Note>

## Custom CA certificates

If your enterprise environment uses a custom CA, configure Claude Code to trust it directly:

```bash theme={null}
export NODE_EXTRA_CA_CERTS=/path/to/ca-cert.pem
```

## mTLS authentication

For enterprise environments requiring client certificate authentication:

```bash theme={null}
# Client certificate for authentication
export CLAUDE_CODE_CLIENT_CERT=/path/to/client-cert.pem

# Client private key
export CLAUDE_CODE_CLIENT_KEY=/path/to/client-key.pem

# Optional: Passphrase for encrypted private key
export CLAUDE_CODE_CLIENT_KEY_PASSPHRASE="your-passphrase"
```

## Network access requirements

Claude Code requires access to the following URLs. Allowlist these in your proxy configuration and firewall rules, especially in containerized or restricted network environments.

| URL                            | Required for                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.anthropic.com`            | Claude API requests                                                                                                               |
| `claude.ai`                    | claude.ai account authentication                                                                                                  |
| `platform.claude.com`          | Anthropic Console account authentication                                                                                          |
| `downloads.claude.ai`          | Plugin executable downloads; native installer and native auto-updater                                                             |
| `storage.googleapis.com`       | Native installer and native auto-updater on versions prior to 2.1.116                                                             |
| `bridge.claudeusercontent.com` | [Claude in Chrome](/docs/en/chrome) extension WebSocket bridge                                                                         |
| `raw.githubusercontent.com`    | Changelog feed for [`/release-notes`](/docs/en/commands) and the release notes shown after updating; plugin marketplace install counts |

If you install Claude Code through npm or manage your own binary distribution, end users may not need access to `downloads.claude.ai` or `storage.googleapis.com`.

Claude Code also sends optional operational telemetry by default, which you can disable with environment variables. See [Telemetry services](/docs/en/data-usage#telemetry-services) for how to disable it before finalizing your allowlist.

When using [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), or [Microsoft Foundry](/docs/en/microsoft-foundry), model traffic and authentication go to your provider instead of `api.anthropic.com`, `claude.ai`, or `platform.claude.com`. The WebFetch tool still calls `api.anthropic.com` for its [domain safety check](/docs/en/data-usage#webfetch-domain-safety-check) unless you set `skipWebFetchPreflight: true` in [settings](/docs/en/settings).

[Claude Code on the web](/docs/en/claude-code-on-the-web) and [Code Review](/docs/en/code-review) connect to your repositories from Anthropic-managed infrastructure. If your GitHub Enterprise Cloud organization restricts access by IP address, enable [IP allow list inheritance for installed GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization#allowing-access-by-github-apps). The Claude GitHub App registers its IP ranges, so enabling this setting allows access without manual configuration. To [add the ranges to your allow list manually](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization#adding-an-allowed-ip-address) instead, or to configure other firewalls, see the [Anthropic API IP addresses](https://platform.claude.com/docs/en/api/ip-addresses).

For self-hosted [GitHub Enterprise Server](/docs/en/github-enterprise-server) instances behind a firewall, allowlist the same [Anthropic API IP addresses](https://platform.claude.com/docs/en/api/ip-addresses) so Anthropic infrastructure can reach your GHES host to clone repositories and post review comments.

## Additional resources

* [Claude Code settings](/docs/en/settings)
* [Environment variables reference](/docs/en/env-vars)
* [Troubleshooting guide](/docs/en/troubleshooting)


---

## LLM gateway configuration

`https://code.claude.com/docs/en/llm-gateway`

Learn how to configure Claude Code to work with LLM gateway solutions. Covers gateway requirements, authentication configuration, model selection, and provider-specific endpoint setup.

LLM gateways provide a centralized proxy layer between Claude Code and model providers, often providing:

* **Centralized authentication** - Single point for API key management
* **Usage tracking** - Monitor usage across teams and projects
* **Cost controls** - Implement budgets and rate limits
* **Audit logging** - Track all model interactions for compliance
* **Model routing** - Switch between providers without code changes

## Gateway requirements

For an LLM gateway to work with Claude Code, it must meet the following requirements:

**API format**

The gateway must expose to clients at least one of the following API formats:

1. **Anthropic Messages**: `/v1/messages`, `/v1/messages/count_tokens`
   * Must forward request headers: `anthropic-beta`, `anthropic-version`

2. **Bedrock InvokeModel**: `/invoke`, `/invoke-with-response-stream`
   * Must preserve request body fields: `anthropic_beta`, `anthropic_version`

3. **Vertex rawPredict**: `:rawPredict`, `:streamRawPredict`, `/count-tokens:rawPredict`
   * Must forward request headers: `anthropic-beta`, `anthropic-version`

Failure to forward headers or preserve body fields may result in reduced functionality or inability to use Claude Code features.

<Note>
  Claude Code determines which features to enable based on the API format. When using the Anthropic Messages format with Bedrock or Vertex, you may need to set environment variable `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`.
</Note>

**Request headers**

Claude Code includes the following headers on API requests:

| Header                          | Description                                                                                                                                                                                                                                                              |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-Claude-Code-Session-Id`      | A unique identifier for the current Claude Code session. Proxies can use this to aggregate all API requests from a single session without parsing the request body.                                                                                                      |
| `X-Claude-Code-Agent-Id`        | Identifier of the subagent or teammate that issued the request. Your proxy can use this to attribute API cost to individual parallel subagents within a session, without parsing the request body. Present only for requests made by an in-process subagent or teammate. |
| `X-Claude-Code-Parent-Agent-Id` | Identifier of the agent that spawned the agent making the request. Use this with `X-Claude-Code-Agent-Id` to attribute API costs across nested agents in your proxy. Present only when the requesting agent was itself spawned by another agent.                         |

Both agent ID headers are ephemeral per-spawn identifiers, not persistent user or device IDs.

Claude Code also prepends a short attribution block to the system prompt containing the client version and a fingerprint derived from the conversation. The Anthropic API strips this block before processing, so it does not affect first-party prompt caching. If your gateway implements its own prompt cache keyed on the full request body, set [`CLAUDE_CODE_ATTRIBUTION_HEADER=0`](/docs/en/env-vars) to omit it.

## Configuration

### Model selection

By default, Claude Code uses standard model names for the selected API format.

When `ANTHROPIC_BASE_URL` points at a gateway that exposes the Anthropic Messages format, Claude Code can query the gateway's `/v1/models` endpoint at startup and add the returned models to the `/model` picker. Set `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` to enable this. Discovery is off by default so that gateways backed by a shared API key do not surface every model the key can access to every user. Each discovered entry is labeled "From gateway" and uses the `display_name` field from the response when one is provided. This requires Claude Code v2.1.129 or later.

Discovery applies only to the Anthropic Messages format. It does not run for Bedrock or Vertex pass-through endpoints, and it does not run when `ANTHROPIC_BASE_URL` is unset or points at `api.anthropic.com`.

The discovery request authenticates the same way as inference requests: it sends `ANTHROPIC_AUTH_TOKEN` as a bearer token, or `ANTHROPIC_API_KEY` as the `x-api-key` header when no auth token is set, along with any headers from `ANTHROPIC_CUSTOM_HEADERS`. Only models whose ID begins with `claude` or `anthropic` are added to the picker. Results are cached to `~/.claude/cache/gateway-models.json` and refreshed on each startup. If the request fails or the gateway does not implement `/v1/models`, the picker falls back to the cached list from the previous startup or to the built-in model list.

If your gateway uses model names that do not match the discovery filter, use the environment variables documented in [Model configuration](/docs/en/model-config) to add them manually.

## LiteLLM configuration

<Warning>
  LiteLLM PyPI versions 1.82.7 and 1.82.8 were compromised with credential-stealing malware. Do not install these versions. If you have already installed them:

  * Remove the package
  * Rotate all credentials on affected systems
  * Follow the remediation steps in [BerriAI/litellm#24518](https://github.com/BerriAI/litellm/issues/24518)

  LiteLLM is a third-party proxy service. Anthropic doesn't endorse, maintain, or audit LiteLLM's security or functionality. This guide is provided for informational purposes and may become outdated. Use at your own discretion.
</Warning>

### Prerequisites

* Claude Code updated to the latest version
* LiteLLM Proxy Server deployed and accessible
* Access to Claude models through your chosen provider

### Basic LiteLLM setup

**Configure Claude Code**:

#### Authentication methods

##### Static API key

Simplest method using a fixed API key:

```bash theme={null}
# Set in environment
export ANTHROPIC_AUTH_TOKEN=sk-litellm-static-key

# Or in Claude Code settings
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key"
  }
}
```

This value will be sent as the `Authorization` header.

##### Dynamic API key with helper

For rotating keys or per-user authentication:

1. Create an API key helper script:

```bash theme={null}
#!/bin/bash
# ~/bin/get-litellm-key.sh

# Example: Fetch key from vault
vault kv get -field=api_key secret/litellm/claude-code

# Example: Generate JWT token
jwt encode \
  --secret="${JWT_SECRET}" \
  --exp="+1h" \
  '{"user":"'${USER}'","team":"engineering"}'
```

2. Configure Claude Code settings to use the helper:

```json theme={null}
{
  "apiKeyHelper": "~/bin/get-litellm-key.sh"
}
```

3. Set token refresh interval:

```bash theme={null}
# Refresh every hour (3600000 ms)
export CLAUDE_CODE_API_KEY_HELPER_TTL_MS=3600000
```

This value will be sent as `Authorization` and `X-Api-Key` headers. The `apiKeyHelper` has lower precedence than `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY`.

#### Unified endpoint (recommended)

Using LiteLLM's [Anthropic format endpoint](https://docs.litellm.ai/docs/anthropic_unified):

```bash theme={null}
export ANTHROPIC_BASE_URL=https://litellm-server:4000
```

**Benefits of the unified endpoint over pass-through endpoints:**

* Load balancing
* Fallbacks
* Consistent support for cost tracking and end-user tracking

#### Provider-specific pass-through endpoints (alternative)

##### Claude API through LiteLLM

Using [pass-through endpoint](https://docs.litellm.ai/docs/pass_through/anthropic_completion):

```bash theme={null}
export ANTHROPIC_BASE_URL=https://litellm-server:4000/anthropic
```

##### Amazon Bedrock through LiteLLM

Using [pass-through endpoint](https://docs.litellm.ai/docs/pass_through/bedrock):

```bash theme={null}
export ANTHROPIC_BEDROCK_BASE_URL=https://litellm-server:4000/bedrock
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
export CLAUDE_CODE_USE_BEDROCK=1
```

##### Google Vertex AI through LiteLLM

Using [pass-through endpoint](https://docs.litellm.ai/docs/pass_through/vertex_ai):

```bash theme={null}
export ANTHROPIC_VERTEX_BASE_URL=https://litellm-server:4000/vertex_ai/v1
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLAUDE_CODE_SKIP_VERTEX_AUTH=1
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
```

##### Claude Platform on AWS through a gateway

Route to a gateway that forwards to the [Claude Platform on AWS](/docs/en/claude-platform-on-aws) endpoint:

```bash theme={null}
export ANTHROPIC_AWS_BASE_URL=https://litellm-server:4000/anthropic-aws
export ANTHROPIC_AWS_WORKSPACE_ID=wrkspc_01ABCDEFGHIJKLMN
export CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH=1
export CLAUDE_CODE_USE_ANTHROPIC_AWS=1
```

For more detailed information, refer to the [LiteLLM documentation](https://docs.litellm.ai/).

## Additional resources

* [LiteLLM documentation](https://docs.litellm.ai/)
* [Claude Code settings](/docs/en/settings)
* [Enterprise network configuration](/docs/en/network-config)
* [Third-party integrations overview](/docs/en/third-party-integrations)


---

## Development containers

`https://code.claude.com/docs/en/devcontainer`

Run Claude Code inside a dev container for consistent, isolated environments across your team.

A [development container](https://containers.dev/), or dev container, lets you define an identical, isolated environment that every engineer on your team can run. With Claude Code installed in that container, commands Claude runs execute inside it rather than on the host machine, while edits to your project files appear in your local repository as you work.

This page covers [installing Claude Code in a dev container](#add-claude-code-to-your-dev-container) and the configuration topics that follow. Each topic is self-contained, so jump to the ones that match what you need to set up:

* [Persist authentication and settings across rebuilds](#persist-authentication-and-settings-across-rebuilds)
* [Enforce organization policy](#enforce-organization-policy)
* [Restrict network egress](#restrict-network-egress)
* [Run without permission prompts](#run-without-permission-prompts)

<Warning>
  While the dev container provides substantial protections, no system is completely immune to all attacks.
  When executed with `--dangerously-skip-permissions`, dev containers do not prevent a malicious project from exfiltrating anything accessible inside the container, including the Claude Code credentials stored in [`~/.claude`](/docs/en/claude-directory).
  Only use dev containers when developing with trusted repositories, and monitor Claude's activities.
  Avoid mounting host secrets such as `~/.ssh` or cloud credential files into the container; prefer repository-scoped or short-lived tokens.
</Warning>

<Accordion title="How dev containers work with your editor">
  <img alt="Diagram showing an editor on the host connecting to a Docker dev container. Claude Code, the terminal, and build tools run inside the container. The host repository is bind-mounted into the container as the workspace." />

  <img alt="Diagram showing an editor on the host connecting to a Docker dev container. Claude Code, the terminal, and build tools run inside the container. The host repository is bind-mounted into the container as the workspace." />

  A dev container runs as a Docker container, either on your machine or on a cloud host such as GitHub Codespaces. An editor that supports the Dev Containers spec, such as VS Code, GitHub Codespaces, a JetBrains IDE, or Cursor, connects to that container: you browse and edit files in the editor as usual, but the integrated terminal, language servers, and build tools all run inside the container rather than on your host. Editors without dev container support, such as plain Vim, are not part of this workflow.

  Claude Code runs inside the container, so it sees the same files, dependencies, and tools as the rest of your project's toolchain. In VS Code you can use either the [Claude Code extension panel](/docs/en/vs-code) or run `claude` in the integrated terminal; both run inside the container and share the same `~/.claude` configuration.
</Accordion>

## Add Claude Code to your dev container

Claude Code installs into any dev container through the [Claude Code Dev Container Feature](https://github.com/anthropics/devcontainer-features/tree/main/src/claude-code).

The settings work with any tool that supports the Dev Containers spec, such as VS Code, GitHub Codespaces, or JetBrains IDEs. The steps below use VS Code as an example.

When you open the container in VS Code or Codespaces, the feature also adds the Claude Code VS Code extension; other editors ignore that part.

<Tip>
  New to dev containers? The [VS Code Dev Containers tutorial](https://code.visualstudio.com/docs/devcontainers/tutorial) walks through installing Docker, the extension, and opening your first container. For a fuller hardened example with a firewall and persistent volumes, see [Try the reference container](#try-the-reference-container).
</Tip>

<Steps>
  <Step title="Create or update devcontainer.json">
    Save the following as `.devcontainer/devcontainer.json` in your repository, or add the `features` block to your existing file.

    The version tag at the end, such as `:1.0`, pins the feature's install script, not the Claude Code release. The feature installs the latest Claude Code, and Claude Code auto-updates itself inside the container by default.

    To pin the CLI version or disable auto-update, see [Enforce organization policy](#enforce-organization-policy).

    ```json .devcontainer/devcontainer.json theme={null}
    {
      "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
      "features": {
        "ghcr.io/anthropics/devcontainer-features/claude-code:1.0": {}
      }
    }
    ```

    Replace the `image` line with your project's base image or remove it if your existing file uses a Dockerfile.
  </Step>

  <Step title="Rebuild the container">
    Open the VS Code Command Palette with `Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows and Linux, and run **Dev Containers: Rebuild Container**.

    For other tools, follow that tool's rebuild action: see [rebuilding in GitHub Codespaces](https://docs.github.com/en/codespaces/developing-in-a-codespace/rebuilding-the-container-in-a-codespace), the [Dev Containers CLI](https://github.com/devcontainers/cli), or your IDE's dev container documentation.
  </Step>

  <Step title="Sign in to Claude Code">
    Open a terminal in the rebuilt container and run `claude`, then follow the authentication prompt.
  </Step>
</Steps>

What you see at the authentication prompt depends on your provider:

* **Anthropic**: sign in through a browser with your Claude or Anthropic Console account
* **[Amazon Bedrock, Google Vertex AI, or Microsoft Foundry](/docs/en/third-party-integrations)**: Claude Code uses your cloud provider credentials, with no browser prompt

For cloud providers, pass credentials into the container as environment variables through `containerEnv`, a Codespaces secret, or your cloud's workload identity rather than mounting credential files from the host. See [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), or [Microsoft Foundry](/docs/en/microsoft-foundry) for the credential chain Claude Code reads.

See [Choose your API provider](/docs/en/admin-setup#choose-your-api-provider) to decide which path fits your organization.

<Note>
  If the browser sign-in completes but the callback never reaches the container, copy the code shown in the browser and paste it at the `Paste code here if prompted` prompt in the terminal. This can happen when the editor's port forwarding doesn't route the localhost callback.
</Note>

## Persist authentication and settings across rebuilds

By default, the container's home directory is discarded on rebuild, so engineers must sign in again each time. Claude Code stores its authentication token, user settings, and session history under [`~/.claude`](/docs/en/claude-directory). Mount a named volume at that path to keep this state across rebuilds.

The following example mounts a volume at the home directory of the `node` user:

```json devcontainer.json theme={null}
"mounts": [
  "source=claude-code-config,target=/home/node/.claude,type=volume"
]
```

Replace `/home/node` with the home directory of your container's `remoteUser`. If you mount the volume somewhere other than `~/.claude`, set [`CLAUDE_CONFIG_DIR`](/docs/en/env-vars) to the mount path so Claude Code reads and writes there.

To isolate state per project rather than sharing one volume across all repositories, include the `${devcontainerId}` variable in the source name. The [reference configuration](https://github.com/anthropics/claude-code/blob/main/.devcontainer/devcontainer.json) uses `source=claude-code-config-${devcontainerId}` for this purpose.

In GitHub Codespaces, `~/.claude` persists across stopping and starting a codespace, but is still cleared when you rebuild the container, so the volume mount above applies there too. To carry authentication across codespaces, store `ANTHROPIC_API_KEY` or a `CLAUDE_CODE_OAUTH_TOKEN` from [`claude setup-token`](/docs/en/authentication#generate-a-long-lived-token) as a [Codespaces secret](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces); Codespaces makes secrets available as environment variables inside the container automatically.

## Enforce organization policy

A dev container is a convenient place to apply organization policy, because the same image and configuration run on every engineer's machine.

Claude Code reads `/etc/claude-code/managed-settings.json` on Linux and applies it at the highest precedence in the [settings hierarchy](/docs/en/settings#how-scopes-interact), so values there override anything an engineer sets in `~/.claude` or the project's `.claude/` directory. Copy the file into place from your Dockerfile:

```dockerfile Dockerfile theme={null}
RUN mkdir -p /etc/claude-code
COPY managed-settings.json /etc/claude-code/managed-settings.json
```

Because the Dockerfile lives in the repository, anyone with write access can change or remove this step. For policy that engineers cannot bypass by editing repository files, deliver managed settings through [server-managed settings](/docs/en/server-managed-settings) or your MDM instead. See [managed settings files](/docs/en/settings#settings-files) for the available keys and the other delivery paths.

To set [environment variables](/docs/en/env-vars) that apply to every Claude Code session in the container, add them to `containerEnv` in your `devcontainer.json`. The following example opts out of telemetry and error reporting and prevents Claude Code from auto-updating after install:

```json devcontainer.json theme={null}
"containerEnv": {
  "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
  "DISABLE_AUTOUPDATER": "1"
}
```

The Dev Container Feature always installs the latest Claude Code release. To pin a specific Claude Code version for reproducible builds, install it from your Dockerfile with `npm install -g @anthropic-ai/claude-code@X.Y.Z` instead of using the feature, and set `DISABLE_AUTOUPDATER` as shown above.

For the full list of policy controls including permission rules, tool restrictions, and MCP server allowlists, see [Set up Claude Code for your organization](/docs/en/admin-setup).

To make [MCP servers](/docs/en/mcp) available inside the container, define them at [project scope](/docs/en/mcp#mcp-installation-scopes) in a `.mcp.json` file at the repository root so they are checked in alongside your dev container configuration. Install any binaries that local stdio servers depend on in your Dockerfile, and add remote server domains to your network allowlist.

## Restrict network egress

You can limit the container's outbound traffic to only the domains Claude Code needs. See [Network access requirements](/docs/en/network-config#network-access-requirements) for the inference and authentication domains, and [Telemetry services](/docs/en/data-usage#telemetry-services) for the optional telemetry and error reporting connections and how to disable them.

The reference container includes an [`init-firewall.sh`](https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh) script that blocks all outbound traffic except the domains Claude Code and your development tools need. Running a firewall inside a container requires extra permissions, so the reference adds the `NET_ADMIN` and `NET_RAW` capabilities through `runArgs`. The firewall script and these capabilities are not required for Claude Code itself: you can leave them out and rely on your own network controls instead.

## Run without permission prompts

Because the container runs Claude Code as a non-root user and confines command execution to the container, you can pass `--dangerously-skip-permissions` for unattended operation. The CLI rejects this flag when launched as root, so confirm `remoteUser` is set to a non-root account.

Skipping permission prompts removes your opportunity to review tool calls before they run. Claude can still modify any file in the bind-mounted workspace, which appears directly on your host, and reach anything the container's network policy allows. Pair this flag with the [network egress restrictions](#restrict-network-egress) above to limit what a bypassed session can reach.

If you want fewer prompts without disabling safety checks, consider [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) instead, which has a classifier review actions before they run. To prevent engineers from using `--dangerously-skip-permissions` at all, set `permissions.disableBypassPermissionsMode` to `"disable"` in [managed settings](/docs/en/settings#permission-settings).

## Try the reference container

The [`anthropics/claude-code`](https://github.com/anthropics/claude-code/tree/main/.devcontainer) repository includes an example dev container that combines the CLI, the egress firewall, persistent volumes, and a Zsh-based shell. It is provided as a working example rather than a maintained base image; use it to see how the pieces fit together before applying them to your own configuration.

<Steps>
  <Step title="Install prerequisites">
    Install VS Code and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
  </Step>

  <Step title="Clone the reference">
    Clone the [Claude Code repository](https://github.com/anthropics/claude-code) and open it in VS Code.
  </Step>

  <Step title="Reopen in container">
    When prompted, click **Reopen in Container**, or run **Dev Containers: Reopen in Container** from the Command Palette.
  </Step>

  <Step title="Start Claude Code">
    Once the container finishes building, open a terminal with `` Ctrl+` `` and run `claude` to sign in and start your first session.
  </Step>
</Steps>

To use this configuration with your own project, copy the `.devcontainer/` directory into your repository and adjust the Dockerfile for your toolchain, or return to [Add Claude Code to your dev container](#add-claude-code-to-your-dev-container) to add only the feature to a setup you already have.

The reference configuration consists of three files. None of them are required when you add Claude Code to your own dev container through the feature, but they show one way to combine the pieces.

| File                                                                                                       | Purpose                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`devcontainer.json`](https://github.com/anthropics/claude-code/blob/main/.devcontainer/devcontainer.json) | Volume mounts, `runArgs` capabilities, VS Code extensions, and `containerEnv` |
| [`Dockerfile`](https://github.com/anthropics/claude-code/blob/main/.devcontainer/Dockerfile)               | Base image, development tools, and the Claude Code install                    |
| [`init-firewall.sh`](https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh)   | Blocks all outbound network traffic except the allowed domains                |

## Next steps

Once Claude Code is running in your dev container, the pages below cover the rest of an organization rollout: choosing an authentication path, delivering managed policy outside the repository, monitoring usage, and understanding what Claude Code stores and sends.

* [Set up Claude Code for your organization](/docs/en/admin-setup): choose an authentication provider, decide how policy reaches devices, and plan the rollout
* [Server-managed settings](/docs/en/server-managed-settings): deliver managed policy from the Claude.ai admin console so engineers cannot bypass it by editing repository files
* [Monitor usage and audit activity](/docs/en/monitoring-usage): export OpenTelemetry metrics and review what your team is running
* [Network access requirements](/docs/en/network-config#network-access-requirements): the full domain allowlist for proxies and firewalls
* [Telemetry services and opt-out](/docs/en/data-usage#telemetry-services): what Claude Code sends by default and the environment variables that disable it
* [Explore the `.claude` directory](/docs/en/claude-directory): what the volume mount holds, including credentials, settings, and session history
* [Sandbox environments](/docs/en/sandbox-environments): compare dev containers with the built-in Bash sandbox, custom containers, and VMs
* [Security model](/docs/en/security): how Claude Code's permission system, sandboxing, and prompt-injection protections fit together
* [Permission modes](/docs/en/permission-modes): the full range from plan mode to auto mode to bypass, and when to use each


---

## Configure the sandboxed Bash tool

`https://code.claude.com/docs/en/sandboxing`

Learn how Claude Code's sandboxed Bash tool provides filesystem and network isolation for safer, more autonomous agent execution.

The Bash sandbox lets Claude run most shell commands without stopping to ask permission. Instead of approving each command, you define which files and network domains commands can touch, and the operating system enforces that boundary for every Bash command and its child processes.

This page covers how to:

* [Enable the sandbox](#get-started) and choose how sandboxed commands are approved
* [Configure](#configure-sandboxing) which paths and network domains commands can reach
* [Combine sandboxing with permission rules and permission modes](#how-sandboxing-relates-to-permissions-and-permission-modes)
* [Enforce sandboxing across an organization](#configure-the-sandbox-for-your-organization) with managed settings

<Note>
  To compare other isolation approaches such as dev containers, custom containers, and virtual machines, see [Sandbox environments](/docs/en/sandbox-environments). To reduce permission prompts for tools other than Bash, see [permission modes](/docs/en/permission-modes).
</Note>

## Get started

The sandbox is built into Claude Code and runs on macOS, Linux, and WSL2. Native Windows is not supported. On Windows, run Claude Code inside a WSL2 distribution.

On macOS, there is nothing to install: sandboxing uses the built-in Seatbelt framework. On Linux and WSL2, the sandbox relies on two packages, covered in [Set up Linux and WSL2](#set-up-linux-and-wsl2). Even if you haven't installed them yet, you can start with `/sandbox`, because its panel shows whether anything is missing.

<Steps>
  <Step title="Run /sandbox">
    Start a Claude Code session and run the `/sandbox` command:

    ```text theme={null}
    /sandbox
    ```

    This opens the sandbox panel with three tabs:

    * **Mode**: choose how sandboxed commands are approved, covered in the next step
    * **Overrides**: choose whether commands that fail under the sandbox can fall back to running unsandboxed. This is the [`allowUnsandboxedCommands`](/docs/en/settings#sandbox-settings) setting
    * **Config**: view the resolved sandbox settings

    If the panel shows only a Dependencies tab, a required package is missing. Install it as described in [Set up Linux and WSL2](#set-up-linux-and-wsl2), restart Claude Code, and run `/sandbox` again.
  </Step>

  <Step title="Choose a mode">
    On the Mode tab, select auto-allow or regular permissions. Auto-allow runs sandboxed commands without prompting, and regular permissions keeps the regular permission prompts even when commands are sandboxed. See [Sandbox modes](#sandbox-modes) for which commands still prompt in auto-allow mode.
  </Step>

  <Step title="Run a Bash command">
    Ask Claude to run a command, such as a build or a test suite. By default, commands inside the sandbox can write only to the working directory. The first time a command needs a new network domain, Claude Code prompts for approval.

    Commands that cannot run sandboxed fall back to the regular permission flow. To widen or narrow these boundaries, see [Configure sandboxing](#configure-sandboxing).
  </Step>
</Steps>

Selecting a mode in the panel writes to your project's local settings at `.claude/settings.local.json`, which apply to the current project and are not checked into git. To enable the sandbox across all of your projects, set [`sandbox.enabled`](/docs/en/settings#sandbox-settings) to `true` in your user settings at `~/.claude/settings.json`. To enforce sandboxing for every developer in an organization, use [managed settings](#enforce-sandboxing-with-managed-settings).

<Warning>
  By default, if the sandbox cannot start because dependencies are missing or the platform is unsupported, Claude Code shows a warning and runs commands without sandboxing. To make this a hard failure instead, set [`sandbox.failIfUnavailable`](/docs/en/settings#sandbox-settings) to `true`. This is intended for managed deployments that require sandboxing as a security gate.
</Warning>

### Set up Linux and WSL2

On Linux and WSL2, the sandbox relies on two packages:

* [`bubblewrap`](https://github.com/containers/bubblewrap): the unprivileged sandboxing tool that enforces filesystem isolation
* [`socat`](http://www.dest-unreach.org/socat/): the relay used to route network traffic through the sandbox proxy

Install them with your distribution's package manager:

<Tabs>
  <Tab title="Ubuntu/Debian">
    ```bash theme={null}
    sudo apt-get install bubblewrap socat
    ```
  </Tab>

  <Tab title="Fedora">
    ```bash theme={null}
    sudo dnf install bubblewrap socat
    ```
  </Tab>
</Tabs>

After installing, the Dependencies tab in `/sandbox` shows whether `ripgrep`, `bubblewrap`, `socat`, and the seccomp filter are available on your platform. Ripgrep is bundled with the native Claude Code binary. The seccomp filter is optional and adds Unix domain socket blocking. Install it with `npm install -g @anthropic-ai/sandbox-runtime` if it is missing.

When a required dependency is missing, the Dependencies tab is the only tab shown until you install it. The dependency check runs at startup, so restart Claude Code after installing packages for `/sandbox` to detect them.

<AccordionGroup>
  <Accordion title="Ubuntu 24.04 and later: allow bubblewrap to create user namespaces">
    On Ubuntu 24.04 and later, the default AppArmor policy prevents bubblewrap from creating the user namespaces it needs for isolation.

    To check whether your environment enforces this restriction, including inside WSL2, run `sysctl kernel.apparmor_restrict_unprivileged_userns`. If the key does not exist or returns `0`, skip this step. If it returns `1`, add an AppArmor profile that grants `bwrap` this capability:

    ```bash theme={null}
    sudo tee /etc/apparmor.d/bwrap > /dev/null <<'EOF'
    abi <abi/4.0>,
    include <tunables/global>

    profile bwrap /usr/bin/bwrap flags=(unconfined) {
      userns,
      include if exists <local/bwrap>
    }
    EOF
    ```

    The profile applies only to `bwrap` itself, not to the commands it runs inside the sandbox. Reload AppArmor to apply it:

    ```bash theme={null}
    sudo systemctl reload apparmor
    ```
  </Accordion>

  <Accordion title="WSL2 notes">
    Check your WSL version with `wsl -l -v` from PowerShell. If you see `Sandboxing requires WSL2`, your distribution is running WSL1. Upgrade it to WSL2 or run Claude Code without sandboxing.

    On WSL2, sandboxed commands cannot launch Windows binaries such as `cmd.exe`, `powershell.exe`, or anything under `/mnt/c/`. WSL hands these off to the Windows host over a Unix socket, which the sandbox blocks. If a command needs to invoke a Windows binary, add it to [`excludedCommands`](/docs/en/settings#sandbox-settings) so it runs outside the sandbox.
  </Accordion>
</AccordionGroup>

### Sandbox modes

Claude Code offers two sandbox modes:

**Auto-allow mode**: Bash commands will attempt to run inside the sandbox and are automatically allowed without requiring permission. Commands that cannot be sandboxed, such as those needing network access to non-allowed hosts, fall back to the regular permission flow, where Claude Code checks your [permission rules](/docs/en/permissions) and prompts you for any command those rules do not already allow.

Even in auto-allow mode, the following still apply:

* Explicit [deny rules](/docs/en/permissions) are always respected
* `rm` or `rmdir` commands that target `/`, your home directory, or other critical system paths still trigger a permission prompt
* [Ask rules](/docs/en/permissions) apply to commands that fall back to the regular permission flow

**Regular permissions mode**: All Bash commands go through the regular permission flow, even when sandboxed. This provides more control but requires more approvals.

In both modes, the sandbox enforces the same filesystem and network restrictions. The difference is only in whether sandboxed commands are auto-approved or require explicit permission.

Some commands cannot run inside the sandbox at all, such as tools that are incompatible with it or that need a host you have not allowed. Rather than failing the task or requiring you to turn sandboxing off, Claude Code includes an escape hatch: when a command fails because of sandbox restrictions, Claude analyzes the failure and may retry the command with the `dangerouslyDisableSandbox` parameter. The retried command runs outside the sandbox, so it goes through the regular permission flow and requires your approval.

You can disable this escape hatch by setting `"allowUnsandboxedCommands": false` in your [sandbox settings](/docs/en/settings#sandbox-settings). When disabled, which the `/sandbox` Overrides tab shows as **Strict sandbox mode**, the `dangerouslyDisableSandbox` parameter is completely ignored and all commands must run sandboxed or be explicitly listed in `excludedCommands`.

<Info>
  Auto-allow mode works independently of your permission mode setting. Even if you're not in "accept edits" mode, sandboxed Bash commands will run automatically when auto-allow is enabled. This means Bash commands that modify files within the sandbox boundaries will execute without prompting, even when file edit tools would normally require approval.
</Info>

## Configure sandboxing

Customize sandbox behavior through your `settings.json` file. See [Settings](/docs/en/settings#sandbox-settings) for the complete configuration reference.

By default, sandboxed commands can only write to the current working directory. If subprocess commands like `kubectl`, `terraform`, or `npm` need to write outside the project directory, use `sandbox.filesystem.allowWrite` to grant access to specific paths:

```json theme={null}
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["~/.kube", "/tmp/build"]
    }
  }
}
```

These paths are enforced at the OS level, so all commands running inside the sandbox, including their child processes, respect them. This is the recommended approach when a tool needs write access to a specific location, rather than excluding the tool from the sandbox entirely with `excludedCommands`.

When the same filesystem array is defined in multiple [settings scopes](/docs/en/settings#settings-precedence), the arrays are merged: paths from every scope are combined, not replaced.

Path prefixes control how paths are resolved:

| Prefix            | Meaning                                                                                | Example                                                                   |
| :---------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `/`               | Absolute path from filesystem root                                                     | `/tmp/build` stays `/tmp/build`                                           |
| `~/`              | Relative to home directory                                                             | `~/.kube` becomes `$HOME/.kube`                                           |
| `./` or no prefix | Relative to the project root for project settings, or to `~/.claude` for user settings | `./output` in `.claude/settings.json` resolves to `<project-root>/output` |

This syntax differs from [Read and Edit permission rules](/docs/en/permissions#read-and-edit), which use `//path` for absolute and `/path` for project-relative. Sandbox filesystem paths use standard conventions: `/tmp/build` is absolute.

You can also deny write or read access using `sandbox.filesystem.denyWrite` and `sandbox.filesystem.denyRead`, and re-allow specific paths within a denied region using `sandbox.filesystem.allowRead`.

The example below blocks reading from the entire home directory while still allowing reads from the current project. Place it in your project's `.claude/settings.json`, because the relative path `.` resolves to the project root only when the configuration lives in project settings:

```json theme={null}
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "denyRead": ["~/"],
      "allowRead": ["."]
    }
  }
}
```

The `.` in `allowRead` resolves to the project root because this configuration lives in project settings. If you placed the same configuration in `~/.claude/settings.json`, `.` would resolve to `~/.claude` instead, and project files would remain blocked by the `denyRead` rule.

## How sandboxing works

### Filesystem isolation

The sandboxed Bash tool restricts file system access to specific directories:

* **Default write behavior**: read and write access to the current working directory and its subdirectories
* **Default read behavior**: read access to the entire computer, except certain denied directories. Note that this default still allows reading credential files such as `~/.aws/credentials` and `~/.ssh/`. Add them to `denyRead` to block them.
* **Blocked access**: cannot modify files outside the current working directory without explicit permission, including shell configuration files such as `~/.bashrc` and system binaries in `/bin/`
* **Git worktrees**: when the working directory is a [linked git worktree](/docs/en/worktrees), the sandbox also allows writes to the main repository's shared `.git` directory so commands such as `git commit` can update refs and the index. Writes to `hooks/` and `config` inside that directory remain denied.
* **Configurable**: define custom allowed and denied paths through settings

You can grant write access to additional paths using `sandbox.filesystem.allowWrite` in your settings. These restrictions are enforced at the OS level, so they apply to all subprocess commands, including tools like `kubectl`, `terraform`, and `npm`, not just Claude's file tools.

### Network isolation

Network access is controlled through a proxy server running outside the sandbox:

* **Domain restrictions**: no domains are pre-allowed. The first time a command needs a new domain, Claude Code prompts for approval. Pre-allow domains with [`allowedDomains`](/docs/en/settings#sandbox-settings) to avoid the prompt.
* **Managed lockdown**: if [`allowManagedDomainsOnly`](/docs/en/settings#sandbox-settings) is set in managed settings, non-allowed domains are blocked automatically instead of prompting, and only `allowedDomains` from managed settings are honored.
* **Custom proxy support**: advanced users can implement custom rules on outgoing traffic
* **Comprehensive coverage**: restrictions apply to all scripts, programs, and subprocesses spawned by commands

<Note>
  The built-in proxy enforces the allowlist based on the requested hostname and does not terminate or inspect TLS traffic. See [Security limitations](#security-limitations) for the implications of this design, and [Custom proxy configuration](#custom-proxy-configuration) if your threat model requires TLS inspection.
</Note>

### OS-level enforcement

The sandboxed Bash tool leverages operating system security primitives:

* **macOS**: uses Seatbelt for sandbox enforcement
* **Linux**: uses [bubblewrap](https://github.com/containers/bubblewrap) for isolation
* **WSL2**: uses bubblewrap, same as Linux

WSL1 is not supported because bubblewrap requires kernel features only available in WSL2. These OS-level restrictions ensure that all child processes spawned by Claude Code's commands inherit the same security boundaries.

These same primitives are available as the standalone [`@anthropic-ai/sandbox-runtime`](https://github.com/anthropic-experimental/sandbox-runtime) package, which the [Sandbox environments](/docs/en/sandbox-environments#sandbox-runtime) page covers as a separate approach for wrapping the entire Claude Code process.

## How sandboxing relates to permissions and permission modes

Sandboxing, [permission rules](/docs/en/permissions), and [permission modes](/docs/en/permission-modes) are complementary layers. The sections below cover how the sandbox interacts with each.

### Permission rules

Permission rules and sandboxing control different things:

* **Permission rules** control which tools Claude Code can use and are evaluated before any tool runs. They apply to all tools: Bash, Read, Edit, WebFetch, MCP, and others.
* **Sandboxing** provides OS-level enforcement that restricts what Bash commands can access at the filesystem and network level. It applies only to Bash commands and their child processes.

The two layers also differ in how they are enforced. Claude Code evaluates permission decisions before a command runs, based on the command string and, in auto mode, a separate classifier's judgment about whether the command is safe. The operating system enforces the sandbox boundary on the running process, so it holds regardless of what the model chose to run and even if an allowed command does more than its name suggests.

Filesystem and network restrictions are configured through both sandbox settings and permission rules:

| Setting or rule                                                  | What it does                                                                                      |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `sandbox.filesystem.allowWrite`                                  | Grants subprocess write access to paths outside the working directory                             |
| `sandbox.filesystem.denyWrite` and `sandbox.filesystem.denyRead` | Block subprocess access to specific paths                                                         |
| `sandbox.filesystem.allowRead`                                   | Re-allows reading specific paths within a `denyRead` region                                       |
| `Edit` allow rules                                               | Grant write access to specific paths, the same way `sandbox.filesystem.allowWrite` does           |
| `Read` and `Edit` deny rules                                     | Block access to specific files or directories                                                     |
| `WebFetch` allow and deny rules                                  | Control domain access                                                                             |
| Sandbox `allowedDomains`                                         | Controls which domains Bash commands can reach                                                    |
| Sandbox `deniedDomains`                                          | Blocks specific domains even when a broader `allowedDomains` wildcard would otherwise permit them |

Paths from both `sandbox.filesystem` settings and permission rules are merged together into the final sandbox configuration.

The [claude-code repository's examples directory](https://github.com/anthropics/claude-code/tree/main/examples/settings) includes starter settings configurations for common deployment scenarios, including sandbox-specific examples. Use these as starting points and adjust them to fit your needs.

### Permission modes

`/sandbox` is not a [permission mode](/docs/en/permission-modes). Permission modes decide whether a tool call runs and whether you are prompted first, while the sandbox restricts what a Bash command can access once it runs. They differ in what they control and what replaces the per-action prompt:

|                                                                    | What it controls                            | What replaces the prompt                                                                                                                        |
| :----------------------------------------------------------------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/sandbox`                                                         | What a Bash command can access once it runs | The sandbox boundary itself, in [auto-allow mode](#sandbox-modes)                                                                               |
| [Auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) | Whether each tool call runs                 | A classifier that reviews actions                                                                                                               |
| `--dangerously-skip-permissions`                                   | Whether each tool call runs                 | Nothing. [Protected path](/docs/en/permission-modes#protected-paths) checks are also skipped; only removing `/` or your home directory still prompts |

The sandbox's [auto-allow mode](#sandbox-modes) is separate from [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode): auto-allow approves Bash commands because the sandbox boundary contains them, while auto mode uses a classifier to review actions. The two work independently and can be combined. To choose an isolation boundary for unattended runs, see [Sandbox environments](/docs/en/sandbox-environments#how-isolation-relates-to-permission-modes).

## Configure the sandbox for your organization

Administrators can require sandboxing for every user, keep developers from widening the policy, and route sandbox traffic through a corporate proxy.

### Enforce sandboxing with managed settings

To require the sandbox for every developer, deliver the `sandbox` keys through [managed settings](/docs/en/settings#settings-files), either as a file managed by your MDM or through [server-managed settings](/docs/en/server-managed-settings) on Claude.ai.

The following managed settings configuration enables the sandbox, refuses to start Claude Code if the sandbox cannot initialize, and prevents the model from retrying commands outside the sandbox:

```json theme={null}
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false
  }
}
```

The two keys beyond `enabled` control what happens when the sandbox cannot run a command:

* **`failIfUnavailable`**: a missing dependency such as bubblewrap on Linux blocks Claude Code from starting rather than showing a warning and falling back to unsandboxed execution
* **`allowUnsandboxedCommands: false`**: the `dangerouslyDisableSandbox` escape hatch is ignored, so commands that fail under the sandbox cannot be retried outside it

Two additions are worth considering alongside them. Add `excludedCommands` for any organization-approved tools that must run without isolation. Add [`denyRead`](#filesystem-isolation) entries for credential directories such as `~/.aws` and `~/.ssh`, which the default read policy still allows.

The sandbox does not run on native Windows, so if your fleet includes Windows hosts, scope this configuration to macOS and Linux or have those users run Claude Code inside WSL2 or a container.

### Keep developers from widening the policy

For boolean keys such as `enabled` and `failIfUnavailable`, Claude Code uses the managed value and ignores anything a developer sets locally. For array keys such as `excludedCommands` and `allowRead`, Claude Code merges entries from every scope, so a developer can append entries that widen the policy.

Set `allowManagedReadPathsOnly` to `true` in managed settings so that only `allowRead` entries from managed settings are honored. User, project, and local `allowRead` entries are ignored. This prevents developers from widening read access beyond the organization-approved paths. To lock network domains to the managed values the same way, set [`allowManagedDomainsOnly`](/docs/en/settings#sandbox-settings).

`excludedCommands` has no equivalent managed-only lockdown, so a developer can always append entries that run additional commands outside the sandbox. Keep the managed list narrow.

### Custom proxy configuration

For organizations requiring advanced network security, you can implement a custom proxy to:

* Decrypt and inspect HTTPS traffic
* Apply custom filtering rules
* Log all network requests
* Integrate with existing security infrastructure

To point Claude Code at your proxy, set the proxy ports in [sandbox settings](/docs/en/settings#sandbox-settings):

```json theme={null}
{
  "sandbox": {
    "network": {
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

## Troubleshooting

Some commands fail inside the sandbox even though they work outside it. The fixes below cover the most common cases.

* **Commands fail with a host-not-allowed error**: many CLI tools need to reach specific hosts. Granting permission when prompted adds the host to your allowed list so the tool runs inside the sandbox in future.
* **`jest` hangs or fails**: `watchman` is incompatible with the sandbox. Run `jest --no-watchman` instead.
* **Go-based CLIs fail TLS verification on macOS**: tools such as `gh`, `gcloud`, and `terraform` may fail TLS verification under Seatbelt. List these tools in `excludedCommands` to run them outside the sandbox. If you are using `httpProxyPort` with a MITM proxy and custom CA, set [`enableWeakerNetworkIsolation`](/docs/en/settings#sandbox-settings) to `true` instead.
* **`docker` commands fail**: `docker` is incompatible with the sandbox. Add `docker *` to `excludedCommands` to run it outside the sandbox.
* **Bubblewrap fails to start inside a container**: in an unprivileged container, bubblewrap cannot mount a fresh `/proc` filesystem. Set [`enableWeakerNestedSandbox`](/docs/en/settings#sandbox-settings) to `true` so the inner sandbox bind-mounts the container's existing `/proc` instead. Only use this setting when the outer container already provides the isolation boundary you need, since it exposes process information to sandboxed commands that a fresh `/proc` mount would hide.
* **Seccomp filter on Linux**: the seccomp filter is required to block Unix domain sockets. The Dependencies tab in `/sandbox` shows whether it is available. If it is missing, run `npm install -g @anthropic-ai/sandbox-runtime` to install the helper.
* **`--dangerously-skip-permissions` fails as root**: this flag is blocked when running as root or via sudo on Linux and macOS, because root access combined with no permission prompts can modify any file or service on the system. The check is skipped automatically inside a recognized sandbox. To run autonomously in a container, use the [dev container](/docs/en/devcontainer) configuration, which runs Claude Code as a non-root user.

## Limitations

Sandboxing reduces risk but is not a complete isolation boundary. Review the limitations below before relying on it as a hard security control.

### Security limitations

* **Network filtering**: the network filtering system operates by restricting the domains that processes are allowed to connect to. The built-in proxy does not terminate or perform TLS inspection on outbound traffic, so the contents of encrypted connections are not examined. You are responsible for ensuring that only trusted domains are allowed in your policy.

<Warning>
  Allowing broad domains such as `github.com` can create paths for data exfiltration. Because the proxy makes its allow decision from the client-supplied hostname without inspecting TLS, code running inside the sandbox can potentially use [domain fronting](https://en.wikipedia.org/wiki/Domain_fronting) or similar techniques to reach hosts outside the allowlist. If your threat model requires stronger guarantees, configure a [custom proxy](#custom-proxy-configuration) that terminates TLS and inspects traffic, and install its CA certificate inside the sandbox. Stronger TLS-aware network isolation is an active area of development.
</Warning>

* **Privilege escalation via Unix sockets**: the `allowUnixSockets` configuration can inadvertently grant access to powerful system services that could lead to sandbox bypasses. For example, allowing access to `/var/run/docker.sock` effectively grants access to the host system through the Docker socket. Consider carefully any Unix sockets that you allow through the sandbox.
* **Filesystem permission escalation**: overly broad filesystem write permissions can enable privilege escalation attacks. Allowing writes to directories containing executables in `$PATH`, system configuration directories, or user shell configuration files such as `.bashrc` or `.zshrc` can lead to code execution in different security contexts when other users or system processes access these files.
* **Linux sandbox strength**: the Linux implementation provides strong filesystem and network isolation but includes an `enableWeakerNestedSandbox` mode that enables it to work inside Docker environments without privileged namespaces, or on Linux hosts where unprivileged user namespaces are disabled by sysctl. This option considerably weakens security and should only be used when additional isolation is otherwise enforced.
* **Settings files protected**: the sandbox automatically denies write access to Claude Code's `settings.json` files at every scope and to the managed settings directory, so a sandboxed command cannot modify its own policy.

### Platform and tool compatibility

* **Platform support**: supports macOS, Linux, and WSL2. WSL1 and native Windows are not supported.
* **Performance overhead**: minimal, but some filesystem operations may be slightly slower.
* **Tool compatibility**: some tools that require specific system access patterns may need configuration adjustments, or may need to be run outside the sandbox.

### Scope

The sandbox isolates Bash subprocesses. Other tools operate under different boundaries:

* **Built-in file tools**: Read, Edit, and Write use the permission system directly rather than running through the sandbox. See [permissions](/docs/en/permissions).
* **Computer use**: when Claude opens apps and controls your screen, it runs on your actual desktop rather than in an isolated environment. Per-app permission prompts gate each application. See [computer use in the CLI](/docs/en/computer-use) or [computer use in Desktop](/docs/en/desktop#let-claude-use-your-computer).
* **Environment variables**: sandboxed Bash commands inherit the parent process environment by default, including any credentials set there. To strip Anthropic and cloud provider credentials from subprocesses, set [`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`](/docs/en/env-vars).
* **Subagents**: [subagents](/docs/en/sub-agents) run in the same process as the parent session and use the same sandbox configuration. Bash commands inside a subagent are sandboxed when sandboxing is enabled in the parent session.

<Warning>
  Effective sandboxing requires both filesystem and network isolation. Without network isolation, a compromised agent could exfiltrate sensitive files like SSH keys. Without filesystem isolation, a compromised agent could backdoor system resources to gain network access. When you widen the defaults, check that an `allowWrite` path, a broad `allowedDomains` entry, or an `excludedCommands` exception does not undo a restriction on the other side.
</Warning>

## See also

* [Sandbox environments](/docs/en/sandbox-environments): compare the built-in sandbox with dev containers, containers, and VMs
* [Security](/docs/en/security): comprehensive security features and best practices
* [Permissions](/docs/en/permissions): permission configuration and access control
* [Settings](/docs/en/settings): complete configuration reference
* [CLI reference](/docs/en/cli-reference): command-line options


---

## Choose a sandbox environment

`https://code.claude.com/docs/en/sandbox-environments`

Compare Claude Code sandbox options: the built-in sandboxed Bash tool, sandbox runtime, dev containers, Docker, and VMs. Choose the right isolation for your threat model.

Isolating Claude Code limits what a session can read, write, and reach on the network. This matters most when you let Claude work with fewer permission prompts, run it unattended, or point it at code you do not fully trust.

Claude Code can run in several kinds of isolated environments, ranging from a lightweight per-command sandbox to a fully separate virtual machine. This page covers how to:

* [Compare](#compare-sandboxing-approaches) the available isolation approaches by what they isolate, what they require, and how much setup is involved
* [Choose](#choose-an-approach) the approach that fits your goal and threat model
* [Get started](#sandboxed-bash-tool) with the approach you picked, from the built-in Bash sandbox to a dedicated virtual machine
* [Enforce](#enforce-isolation-across-an-organization) isolation for every developer in your organization

<Info>
  For the broader security model, see [Security](/docs/en/security). For Agent SDK deployments, see [Secure deployment](/docs/en/agent-sdk/secure-deployment).
</Info>

## Compare sandboxing approaches

The first two approaches in the table below run on the host operating system without containers. The rest place Claude Code inside a container or virtual machine.

| Approach                                          | What is isolated                                                            | Requires Docker | Setup effort                                    |
| :------------------------------------------------ | :-------------------------------------------------------------------------- | :-------------- | :---------------------------------------------- |
| [Sandboxed Bash tool](#sandboxed-bash-tool)       | Bash commands and their child processes                                     | No              | Minimal on macOS; low on Linux and WSL2         |
| [Sandbox runtime](#sandbox-runtime)               | The whole Claude Code process, including file tools, MCP servers, and hooks | No              | Low                                             |
| [Dev container](#dev-containers)                  | Full development environment                                                | Yes             | Medium                                          |
| [Custom container](#custom-container)             | Full development environment                                                | Yes             | Medium to high                                  |
| [Virtual machine](#virtual-machine)               | Full operating system                                                       | No              | High                                            |
| [Claude Code on the web](#claude-code-on-the-web) | Full operating system, hosted by Anthropic                                  | No              | None; requires a Claude subscription and GitHub |

The [sandboxed Bash tool](/docs/en/sandboxing) is built into Claude Code and restricts only Bash commands. Built-in file tools, MCP servers, and hooks still run directly on your host. Every other approach in the table puts the whole Claude Code process inside the isolation boundary, so file tools, MCP servers, and hooks are restricted too.

<Warning>
  Sandbox isolation reduces the impact of a breach, but it does not eliminate risk. Any approach that allows network egress can still leak data the agent can read, and any approach that mounts your project directory writable can still modify that code. Review the [security limitations](/docs/en/sandboxing#security-limitations) before relying on a sandbox as a hard control.

  Isolation also does not change what is sent to the model. Your prompts and the files Claude reads are transmitted to the Anthropic API or your configured provider with or without a sandbox. See [Data usage](/docs/en/data-usage) for what Claude Code sends and how to reduce it.
</Warning>

## Choose an approach

Match your goal to a row below, then read the detail section that follows.

| You want to                                                                   | Start with                                                                                                                                            |
| :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reduce permission prompts during everyday work on your own machine            | The [sandboxed Bash tool](/docs/en/sandboxing), enabled with `/sandbox`                                                                                    |
| Let Claude work unattended with `--dangerously-skip-permissions` or auto mode | The preconfigured [dev container](/docs/en/devcontainer), any container or VM, or the [sandbox runtime](#sandbox-runtime)                                  |
| Isolate MCP servers and hooks as well as Bash, without Docker                 | The sandbox runtime                                                                                                                                   |
| Work on an untrusted repository                                               | A dedicated virtual machine, or [Claude Code on the web](/docs/en/claude-code-on-the-web) if you have a Claude subscription and a connected GitHub account |
| Standardize a sandboxed environment across a team                             | The preconfigured [dev container](/docs/en/devcontainer), copied into your repository                                                                      |
| Use Claude Code from a device with no local setup                             | [Claude Code on the web](/docs/en/claude-code-on-the-web), which requires a Claude subscription and a connected GitHub account                             |
| Require isolation for every developer in your organization                    | [Enforce isolation across an organization](#enforce-isolation-across-an-organization)                                                                 |
| Work on a native Windows host                                                 | A container or VM, or run the Bash sandbox inside WSL2                                                                                                |

### How isolation relates to permission modes

[Permission modes](/docs/en/permission-modes) decide whether a tool call runs and whether you are prompted first. Isolation restricts what a command can access once it runs. The two work together: when a permission mode lets actions run without asking you, an isolation boundary limits what those actions can reach.

`--dangerously-skip-permissions` removes per-action review entirely, so an isolation boundary is the only thing limiting what Claude can do. Always run it inside a container, a VM, or the [sandbox runtime](#sandbox-runtime), so that file tools, MCP servers, and hooks are also inside the boundary.

[Auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) replaces the prompt with a classifier that reviews actions and blocks ones that escalate beyond the request, target unrecognized infrastructure, or appear driven by hostile content Claude read. The classifier is a per-action control, not an isolation boundary, so an isolation boundary still adds defense in depth for unattended runs, and is not required the way it is for `--dangerously-skip-permissions`.

The [sandboxed Bash tool](#sandboxed-bash-tool) on its own constrains only Bash, so it is not sufficient for fully unattended runs in either mode. You can layer approaches: running the sandboxed Bash tool inside a container or VM gives you OS-level command restrictions on top of the outer environment boundary. For how the Bash sandbox itself interacts with permission rules and modes, see [How sandboxing relates to permissions and permission modes](/docs/en/sandboxing#how-sandboxing-relates-to-permissions-and-permission-modes).

## Sandboxed Bash tool

<Note>
  This option does not support native Windows. On Windows hosts, use WSL2 or one of the container or VM approaches below.
</Note>

The sandboxed Bash tool is built into Claude Code. It uses operating system primitives to restrict the filesystem and network access of every Bash command Claude runs: Seatbelt, the built-in macOS sandbox, and [bubblewrap](https://github.com/containers/bubblewrap) on Linux and WSL2. By default it allows writes to the working directory and prompts the first time a command needs a new network domain.

Enable it with the `/sandbox` command. The [Sandboxing](/docs/en/sandboxing) guide covers the approval modes, the default boundary, and how to widen or narrow it.

The per-command sandbox does not cover everything that runs in a session:

* Other [built-in tools](/docs/en/tools-reference) such as Read, Edit, and WebFetch run inside the Claude Code process and do not spawn arbitrary code. [Permission rules](/docs/en/permissions) for path or domain gate them instead.
* [MCP](/docs/en/mcp) servers and hooks are separate processes that run unconstrained on the host.

To put built-in tools, MCP servers, and hooks all behind one OS boundary, run the whole Claude Code process inside the [sandbox runtime](#sandbox-runtime), the [dev container](#dev-containers), or a [custom container](#custom-container).

## Sandbox runtime

The [`@anthropic-ai/sandbox-runtime`](https://github.com/anthropic-experimental/sandbox-runtime) package wraps an entire process in the same Seatbelt or bubblewrap isolation that the built-in Bash sandbox uses. Running Claude Code through it constrains every tool, hook, and MCP server in the session, not only Bash. The runtime is a beta research preview, and its configuration format may change as the package evolves.

The runtime denies all write and network access by default, so configure it before launching Claude Code through it. In `~/.srt-settings.json`, or a file you pass with `--settings`, allow write access to at least your project directory and Claude Code's configuration paths `~/.claude` and `~/.claude.json`. Allow the network domains your session needs, including `api.anthropic.com` or your configured provider's endpoint. See the package [README](https://github.com/anthropic-experimental/sandbox-runtime) for the full configuration schema.

Once the settings file is in place, launch Claude Code with `npx` and pass `claude` as the command to wrap:

```bash theme={null}
npx @anthropic-ai/sandbox-runtime claude
```

Claude Code starts inside the sandbox with the filesystem and network boundaries you configured. The same command works for sandboxing standalone MCP servers or other helper processes.

## Dev containers

A dev container runs Claude Code inside a Docker container that VS Code or a compatible editor manages, with your project mounted in. You can define your own with a `.devcontainer/` directory in your repository.

The claude-code repository publishes an [example dev container](/docs/en/devcontainer) with a default-deny iptables firewall as a starting point. Copy it into your repository and adjust the firewall allowlist, base image, and pinned Claude Code version to fit your environment. Because the firewall blocks unapproved egress, a configuration like this supports running Claude Code with `--dangerously-skip-permissions` for unattended work.

## Custom container

You can run Claude Code in any Docker or OCI container image with your own network policies, mounted volumes, and seccomp profiles. This is the most common path for organizations with existing container infrastructure or CI runners.

Several managed sandbox and remote execution services can host the container for you. The same checklist applies as for any container you operate: review what is mounted writable, what credentials and tokens are reachable inside it, and what the network egress policy allows.

You can layer the built-in Bash sandbox inside the container for per-command restrictions. Unprivileged containers need the nested-sandbox setting described in [Sandboxing troubleshooting](/docs/en/sandboxing#troubleshooting).

## Virtual machine

A dedicated virtual machine provides the strongest separation, with its own kernel and, in cloud or microVM deployments, its own virtualized hardware. Options include cloud instances, local hypervisors, and microVMs such as Firecracker.

Use this approach when you are evaluating untrusted code, when your security policy requires kernel-level separation between the agent and the host, or when no host-level approach meets your compliance requirements. Docker Desktop's [sandboxes feature](https://docs.docker.com/ai/sandboxes/) provides a microVM with its own Docker daemon and workspace sync, which can run Claude Code on hosts that already have Docker Desktop.

## Claude Code on the web

[Claude Code on the web](/docs/en/claude-code-on-the-web) runs each session in an isolated, Anthropic-managed virtual machine. A network proxy enforces a default allowlist, and a separate proxy holds your GitHub token outside the sandbox while issuing scoped credentials for repository access inside it.

Use this approach when you want full VM isolation without provisioning infrastructure yourself, or when you are delegating tasks from a device that does not have a local development environment. It requires a Claude subscription and a connected GitHub account, and sessions clone your repository from GitHub. See [Claude Code on the web](/docs/en/claude-code-on-the-web) for plan availability and GitHub authentication options.

## Enforce isolation across an organization

Individual developers can opt into any approach above. What an organization can enforce, and with which tools, depends on the approach:

* **Built-in Bash sandbox**: the only approach Claude Code enforces itself. Deliver the `sandbox` settings keys through [managed settings](/docs/en/settings#settings-files), either as a file managed by your MDM or through [server-managed settings](/docs/en/server-managed-settings) on Claude.ai. See [Enforce sandboxing with managed settings](/docs/en/sandboxing#enforce-sandboxing-with-managed-settings) for the keys to deploy and how to keep developers from widening the policy.
* **Dev containers**: commit the [example dev container](/docs/en/devcontainer) to your repositories to standardize the environment across a team. This is a convention rather than an enforcement boundary, because Claude Code does not require a container. If developers should not be able to run Claude Code outside it, enforce that with your organization's device management or software allowlisting tools.
* **Custom containers and VMs**: distribute Claude Code through the approved image and use your organization's device management or software allowlisting tools to prevent installation outside it.

## See also

These pages cover configuration and policy details for the approaches above.

* [Sandboxing](/docs/en/sandboxing): configure the built-in sandboxed Bash tool
* [Dev container](/docs/en/devcontainer): the preconfigured Docker development container
* [Security](/docs/en/security): the full Claude Code security model
* [Secure deployment](/docs/en/agent-sdk/secure-deployment): isolation guidance for Agent SDK applications
* [Settings](/docs/en/settings#sandbox-settings): all sandbox configuration keys, including managed settings delivery
