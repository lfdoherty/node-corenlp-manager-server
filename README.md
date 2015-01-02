
Wraps node-stanford-corenlp in a JSON-over-TCP client/server API.  Designed to be used inside a specific Docker image, see node-corenlp-manager-client for usage.

TODOs:
- limit concurrent requests from a given client, ideally with backpressure on the socket.  Ensure only a small number of requests are started per client and once the client connection closes no more are started.