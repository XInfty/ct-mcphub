## Why
To enable fundamental communication and task management within the A2A ecosystem, our agents MUST implement core A2A RPC methods. This includes `message/send` for basic asynchronous communication, `tasks/get` for retrieving task status, and `tasks/cancel` for terminating tasks. These methods are essential for any meaningful interaction with other A2A-compliant agents and are a prerequisite for more advanced A2A features.

## What Changes
- Implementation of the A2A `message/send` RPC method to facilitate sending structured messages between agents.
- Implementation of the A2A `tasks/get` RPC method to retrieve detailed information about a specific task by its ID.
- Implementation of the A2A `tasks/cancel` RPC method to request the cancellation of a running task.
- Integration of these RPC methods with our existing internal communication and task management systems.
- **BREAKING**: Introduction of new API endpoints and changes to internal task/message handling logic to conform to A2A RPC specifications.

## Impact
- **Affected specs**: New `core-rpc` capability spec.
- **Affected code**: 
    - Network communication layer to handle A2A RPC requests and responses.
    - Internal message queuing and processing systems.
    - Internal task management and lifecycle handling.
    - Security and authentication mechanisms for RPC calls.
