# LiteLLM Proxy Research Notes

## Features

### Core Proxy Features
- **Unified Interface**: Access 100+ LLMs using OpenAI-compatible API format
- **Cost Tracking**: Automatic spend calculation and tracking per model, key, user, and team
- **Guardrails**: Content moderation, secret detection/redaction, banned keywords, blocked user lists
- **Load Balancing**: Multiple routing strategies (simple-shuffle, least-busy, usage-based, latency-based)
- **Rate Limiting**: Configurable TPM/RPM limits per deployment, key, user, or team
- **Budgets**: Set spend limits with automatic enforcement
- **Virtual Keys**: API key management with permissions, aliases, and metadata
- **Streaming Support**: Full streaming for all supported models
- **Embeddings**: Support for embedding models from multiple providers
- **Caching**: Built-in caching for improved performance
- **Custom Callbacks**: Integration with logging/observability tools (Lunary, MLflow, Langfuse, Helicone, etc.)
- **Model Fallbacks**: Automatic fallback to alternative models on failure
- **Custom Plugins**: Hooks for modifying requests/responses, auth, logging
- **Secret Managers**: Integration with Azure Vault, Google Secret Manager, Hashicorp Vault
- **Content Moderation**: LLM Guard, LlamaGuard, Google Text Moderation
- **Key Rotations**: Manual and scheduled automatic key rotation
- **Audit Logs**: Comprehensive logging with retention policies
- **IP-based Access Control**: Restrict access by IP address
- **Request Size Limits**: Enforce max request/response sizes
- **Required Parameters**: Enforce specific params in requests
- **Custom Prompt Templates**: Support for model-specific prompt formatting
- **Custom Tokenizers**: Configurable token counting for different models

### Enterprise Features
- **SSO Integration**: Google, Microsoft, Okta, Generic OAuth
- **Custom Branding**: Logo, color themes, custom routes on Swagger
- **Public Model Hub**: Share available models publicly
- **Advanced Security**: JWT Auth, route access control, blocked crawlers
- **Team-based Logging**: Separate logging per team/project
- **Prometheus Metrics**: Detailed metrics for requests, failures, latency
- **AWS Key Manager**: Encrypted key storage and decryption

## Admin UI Capabilities

### Key Management
- Create, edit, delete virtual API keys
- Set budgets, rate limits, and permissions per key
- Model access control and aliases
- Key rotation and temporary budget increases
- View spend analytics per key

### User Management
- Invite users to create their own keys
- Role-based access (admin, viewer, internal user)
- SSO integration with email domain restrictions
- User spend tracking and budgets

### Model Management
- Add new models without restarting proxy
- Model hub for public model discovery
- Sync pricing data from GitHub
- Configure model-specific settings

### Security & Access
- SSO login with multiple providers
- Fallback username/password authentication
- Restrict UI access to admins only
- Custom branding and theming
- Disable default team settings

### Analytics & Monitoring
- Spend tracking dashboard
- Usage metrics and reports
- Audit logs and activity monitoring
- Prometheus integration for advanced metrics

## Security

### Authentication & Authorization
- Master key for admin operations
- Virtual key system with granular permissions
- SSO integration (Google, Microsoft, Okta, Generic OAuth)
- JWT authentication for enterprise
- Role-based access control (proxy_admin, proxy_admin_viewer, internal_user, etc.)
- Email domain restrictions for SSO

### Data Protection
- Secret detection and automatic redaction in requests
- Content moderation with configurable thresholds
- Banned keywords filtering
- Blocked user lists for opt-out functionality
- IP address-based access control
- Request/response size limits to prevent abuse

### Compliance & Auditing
- Comprehensive audit logs with retention policies
- GDPR compliance features (disable logging per team)
- Blocked web crawlers to prevent indexing
- Custom auth hooks for compliance requirements
- Enforced required parameters for data validation

### Network Security
- Control public/private routes
- Admin-only route restrictions
- Custom header support for API keys
- Environment variable encryption for secrets

## Requirements

### System Requirements
- Python 3.8+ (recommended 3.9+)
- PostgreSQL database for key management and spend tracking
- Redis (optional, for distributed caching and load balancing)

### Installation
```bash
pip install 'litellm[proxy]'
```

### Configuration
- **config.yaml**: Required for model definitions, settings, and general configuration
- **Environment Variables**: For API keys, database URLs, master keys
- **Database URL**: PostgreSQL connection string for persistent storage

### Core Setup Steps
1. Install LiteLLM with proxy extras
2. Configure PostgreSQL database
3. Set master key and database URL
4. Create config.yaml with model list
5. Start proxy server: `litellm --config config.yaml`

### UI Setup Requirements
- Master key configured
- Database connection established
- Environment variables for UI customization (optional)
- SSO configuration (optional, enterprise)

### Enterprise Requirements
- LiteLLM Enterprise license key
- Additional environment variables for advanced features
- Secret manager credentials (for encrypted storage)
- SSO provider configuration

### Network Requirements
- Outbound internet access for LLM provider APIs
- Database connectivity (local or cloud)
- Optional: Redis for distributed features
- Optional: Secret manager endpoints

### Performance Considerations
- Database connection pooling configuration
- Redis for state management in multi-instance deployments
- TPM/RPM limits per model deployment
- Caching configuration for improved latency

## Sources
- Official LiteLLM Documentation: https://docs.litellm.ai/
- GitHub Repository: https://github.com/BerriAI/litellm
- Enterprise Features: https://docs.litellm.ai/docs/proxy/enterprise
- Admin UI: https://docs.litellm.ai/docs/proxy/ui
- Virtual Keys: https://docs.litellm.ai/docs/proxy/virtual_keys
- SSO Documentation: https://docs.litellm.ai/docs/proxy/admin_ui_sso