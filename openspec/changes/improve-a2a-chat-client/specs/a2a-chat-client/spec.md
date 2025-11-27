## ADDED Requirements

### Requirement: A2A `AgentCard` Discovery and Integration
The `a2a_chat` tool SHALL be capable of discovering and integrating A2A `AgentCard`s from remote agents to understand their capabilities and communication parameters.

#### Scenario: Agent Card Retrieval and Parsing
- **WHEN** `a2a_chat` attempts to communicate with a new A2A agent
- **THEN** it SHALL retrieve the agent's `AgentCard` from `/.well-known/agent-card.json`.
- **AND** it SHALL parse the `AgentCard` to extract agent `name`, `capabilities`, `securitySchemes`, and `skills`.

#### Scenario: Agent Registry Update
- **WHEN** an `AgentCard` is successfully retrieved and parsed
- **THEN** `a2a_chat`'s internal agent registry SHALL be updated with the discovered A2A agent metadata.

### Requirement: A2A Data Object Handling for Client
The `a2a_chat` tool SHALL correctly handle A2A-compliant `Message` and `Task` objects for both sending and receiving.

#### Scenario: Sending A2A Messages
- **WHEN** `a2a_chat` sends a message to an A2A agent
- **THEN** it SHALL construct and serialize an A2A `Message` object, including X^∞-specific `metadata` if applicable.

#### Scenario: Receiving A2A Tasks and Messages
- **WHEN** `a2a_chat` receives an A2A `Message` or `Task` object
- **THEN** it SHALL deserialize and correctly interpret the A2A object, including any embedded X^∞-specific `metadata`.

### Requirement: A2A RPC Client Functionality
The `a2a_chat` tool SHALL implement client-side logic to make A2A RPC calls and handle their responses, including `JSONRPCError`s.

#### Scenario: Making A2A RPC Calls
- **WHEN** `a2a_chat` needs to perform an action on an A2A agent (e.g., send a message, get task status, cancel a task)
- **THEN** it SHALL construct and send an A2A `JSONRPC` request for the appropriate method (`message/send`, `tasks/get`, `tasks/cancel`).

#### Scenario: Handling A2A `JSONRPCError`s
- **WHEN** `a2a_chat` receives an A2A `JSONRPCError` in response to an RPC call
- **THEN** it SHALL parse the error `code`, `message`, and `data` fields and present informative feedback to the user.

### Requirement: A2A Streaming and Push Notification Consumption
The `a2a_chat` tool SHALL be capable of subscribing to and consuming A2A streaming responses and push notifications.

#### Scenario: Consuming Task Status Streams
- **WHEN** `a2a_chat` subscribes to a task status stream from an A2A agent
- **THEN** it SHALL receive and process continuous updates of the task's status in real-time.

#### Scenario: Receiving Push Notifications
- **WHEN** `a2a_chat` is configured to receive push notifications for events
- **THEN** it SHALL correctly receive and process incoming A2A-compliant push notifications.
