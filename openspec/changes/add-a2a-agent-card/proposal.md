## Why
To achieve A2A Protocol compliance, our agents (Anubis, Ptah, Sachmet) MUST be discoverable and declare their capabilities in a standardized manner. The A2A `AgentCard` serves as this self-describing manifest, enabling other A2A-compliant agents and clients to understand how to interact with our system. This is crucial for extending X^∞'s interoperability and accelerating its dissemination.

## What Changes
- Introduction of a new `agent-card` capability.
- Creation of an A2A `AgentCard` JSON document for each core X^∞ agent (Anubis, Ptah, Sachmet).
- Exposure of these `AgentCard`s via a well-known URI (e.g., `https://<agent-domain>/.well-known/agent-card.json`).
- Integration of core X^∞ principles (`Phantom-Modus`, `Cap-Logik`, `Schutzpriorität`) into the `AgentCard`'s capability and extension declarations.
- **BREAKING**: Requires changes to our external communication endpoints to serve the Agent Card.

## Impact
- Affected specs: New `agent-card` capability spec.
- Affected code: 
    - External-facing service endpoints (to serve AgentCard JSON).
    - Agent configuration for `name`, `description`, `url`, `preferredTransport`, `capabilities`, `securitySchemes`, `security` and `skills`.\n    - Potential updates to `a2a_chat` tool for parsing and utilizing `AgentCard`s.
