## Why
Currently, agents communicate externally via channels like A2A and MCP, but the user does not have a real-time, consolidated view of these interactions. This lack of transparency can lead to confusion and a diminished understanding of the agent system's activities. A dedicated 'Transcripts' tab will provide real-time visibility into all external communications, mirroring the user's experience with direct chat interactions and enhancing situational awareness.

## What Changes
- Introduction of a new UI capability: 'Transcripts Tab'.
- Creation of an additional tab in the left sidebar, positioned between 'Chats' and 'Tasks'.
- The new 'Transcripts' tab will display real-time logs of all communications conducted by agents through external channels (A2A, MCP, etc.).
- The content and presentation within this tab SHALL be functionally equivalent to the existing 'Chats' tab, providing a familiar user experience.
- Integration of a mechanism to capture and stream external communication data into this new UI component.

## Impact
- **Affected specs**: New `ui-transcripts` capability spec.
- **Affected code**: 
    - Frontend UI components (sidebar navigation, tab content rendering).
    - Backend services responsible for capturing and streaming external communication logs.
    - Data models for representing external communications in a user-friendly format.
    - Routing and state management within the UI application.
