## ADDED Requirements

### Requirement: Real-time Transcripts Tab in UI
The user interface SHALL feature a new tab, labeled 'Transcripts', located in the left sidebar between the 'Chats' and 'Tasks' tabs.

#### Scenario: Tab Visibility and Position
- **WHEN** the user navigates the main application interface
- **THEN** a 'Transcripts' tab SHALL be visible in the left sidebar.
- **AND** its position SHALL be immediately to the right of 'Chats' and to the left of 'Tasks'.

### Requirement: Display of External Communications
The 'Transcripts' tab SHALL display real-time logs of all communications conducted by agents through external channels (A2A, MCP, etc.).

#### Scenario: Real-time Content Streaming
- **WHEN** an agent sends or receives a message via an external channel (A2A, MCP, etc.)
- **THEN** the 'Transcripts' tab SHALL update in real-time to display this communication.

#### Scenario: Content Equivalence to Chats Tab
- **WHEN** an external communication is displayed in the 'Transcripts' tab
- **THEN** its presentation (e.g., sender, timestamp, message content, formatting) SHALL be functionally equivalent to how messages are displayed in the 'Chats' tab.

### Requirement: External Communication Data Capture
The backend system SHALL capture and store all external communications (A2A, MCP, etc.) in a persistent, queryable data store, ensuring `AuditChain` compliance.

#### Scenario: Comprehensive Data Logging
- **WHEN** any agent-initiated external communication occurs
- **THEN** the backend SHALL log the `timestamp`, `sender`, `recipient`, `channel` (A2A, MCP), `message_content`, `message_type`, and `associated_task_id`.
- **AND** this data SHALL be stored in a manner that supports efficient real-time retrieval for the 'Transcripts' tab.

### Requirement: Real-time Streaming API for UI
The backend system SHALL provide a real-time streaming API (e.g., WebSocket, SSE) to push new external communication logs to the frontend 'Transcripts' tab.

#### Scenario: Efficient Data Delivery
- **WHEN** new external communication logs are available in the backend
- **THEN** the streaming API SHALL push these logs to the connected frontend 'Transcripts' tab with minimal latency.
