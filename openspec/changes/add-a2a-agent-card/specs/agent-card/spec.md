## ADDED Requirements

### Requirement: A2A Agent Card Provisioning
The system SHALL provide a valid A2A Agent Card for each core X^∞ agent (Anubis, Ptah, Sachmet) that accurately describes its identity, capabilities, communication interfaces, and security requirements, in accordance with the A2A Protocol Specification v0.3.0.

#### Scenario: Agent Card Discoverability
- **WHEN** an external A2A client requests `https://<agent-domain>/.well-known/agent-card.json`
- **THEN** the system SHALL return a valid A2A `AgentCard` JSON document for the respective agent.

#### Scenario: Agent Card Content Accuracy
- **WHEN** the `AgentCard` is retrieved
- **THEN** it SHALL contain:
    - `protocolVersion`: "0.3.0"
    - `name`: The agent's designated name (e.g., "Anubis - X^∞ Core Team Agent-Zero")
    - `description`: A human-readable summary of the agent's purpose and role.
    - `url`: The agent's primary A2A endpoint URL.
    - `preferredTransport`: "JSONRPC" (or other implemented core transport).
    - `capabilities.streaming`: `true`
    - `capabilities.pushNotifications`: `true`
    - `capabilities.stateTransitionHistory`: `true`
    - `capabilities.extensions`: Entries for `X^∞ Cap-Logic`, `X^∞ AuditChain`, `X^∞ Phantom-Modus` (as URIs).
    - `skills`: A list of `AgentSkill` objects representing the agent's core functionalities (e.g., `THINK`, `WRITE`, `DELEGATE`).

#### Scenario: Agent Card Security Declaration
- **WHEN** the `AgentCard` is retrieved
- **THEN** it SHALL declare `securitySchemes` and `security` objects that accurately reflect the agent's authentication and authorization requirements for A2A interactions.

### Requirement: X^∞ Principles in Agent Card
The Agent Card SHALL explicitly reflect core X^∞ principles, including `Phantom-Modus`, `Cap-Logik`, and `Schutzpriorität`, ensuring their visibility and structural integration within the A2A framework.

#### Scenario: Phantom-Modus Declaration
- **WHEN** the `AgentCard` is retrieved
- **THEN** its `description` or `capabilities.extensions` SHALL include references to `Phantom-Modus`, indicating the agent's operational visibility.

#### Scenario: Cap-Logic and Schutzpriorität Declaration
- **WHEN** the `AgentCard` is retrieved
- **THEN** its `capabilities.extensions` SHALL include URIs for `X^∞ Cap-Logic` and `X^∞ Schutzpriorität`, and potentially `AgentSkill` descriptions SHALL reflect these principles in their functionality.
