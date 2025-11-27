## Why
To ensure consistent and interoperable error reporting within the A2A ecosystem, our internal error handling mechanisms MUST be aligned with the A2A `JSONRPCError` structure. This standardization facilitates easier debugging, automated error processing by client agents, and a clear understanding of problem states across different A2A-compliant systems.

## What Changes
- Adoption of the A2A `JSONRPCError` format for all errors returned by A2A RPC methods.
- Mapping of existing internal error codes and messages to A2A `JSONRPCError` `code`, `message`, and optional `data` fields.
- Implementation of a centralized error handling component that converts internal exceptions into A2A-compliant error responses.
- **BREAKING**: Changes to the format of error responses for A2A RPC methods.

## Impact
- **Affected specs**: New `error-handling` capability spec.
- **Affected code**: 
    - All A2A RPC method implementations to ensure they return A2A `JSONRPCError` objects.
    - Internal error handling utilities and exception classes that need to be mapped.
    - Client-side A2A communication logic that parses error responses.
