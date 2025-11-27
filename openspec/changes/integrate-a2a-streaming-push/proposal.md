## Why
To enable efficient and timely communication for long-running operations and real-time updates, our agents MUST integrate A2A streaming and push notification capabilities. This moves beyond traditional request-response models, allowing for server-sent events, partial results, and asynchronous notifications. This is crucial for interactive agent experiences, reducing polling overhead, and supporting X^∞'s `Rückkopplungspflicht` with auditable, real-time feedback.

## What Changes
- Implementation of A2A streaming mechanisms for RPC methods that can return partial or continuous results (e.g., `tasks/stream`).
- Integration of A2A push notification capabilities, allowing agents to subscribe to and receive asynchronous updates for tasks or events (`tasks/pushNotificationConfig`).
- Adaptation of internal feedback loops and event systems to leverage A2A's streaming and push models.
- **BREAKING**: Introduction of new communication paradigms and potential changes to how clients consume agent responses.

## Impact
- **Affected specs**: New `streaming-push` capability spec.
- **Affected code**: 
    - Network communication layer to support long-lived connections and server-sent events.
    - Internal task lifecycle management to trigger push notifications.
    - Client-side A2A communication logic to handle streaming responses and push notifications.
    - Logging and auditing systems for streamed events.
