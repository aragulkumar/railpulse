import json
from typing import Dict, List, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Map train_no -> set of WebSockets
        self.train_connections: Dict[str, Set[WebSocket]] = {}
        # Global listeners (e.g., control room / live boards)
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, train_no: str = None):
        await websocket.accept()
        if train_no:
            if train_no not in self.train_connections:
                self.train_connections[train_no] = set()
            self.train_connections[train_no].add(websocket)
        else:
            self.global_connections.add(websocket)

    def disconnect(self, websocket: WebSocket, train_no: str = None):
        if train_no and train_no in self.train_connections:
            self.train_connections[train_no].discard(websocket)
            if not self.train_connections[train_no]:
                del self.train_connections[train_no]
        self.global_connections.discard(websocket)

    async def broadcast_train_update(self, train_no: str, message: dict):
        data_text = json.dumps(message)
        dead_sockets = []

        # Send to train-specific listeners
        if train_no in self.train_connections:
            for connection in list(self.train_connections[train_no]):
                try:
                    await connection.send_text(data_text)
                except Exception:
                    dead_sockets.append((connection, train_no))

        # Send to global listeners
        for connection in list(self.global_connections):
            try:
                await connection.send_text(data_text)
            except Exception:
                dead_sockets.append((connection, None))

        # Clean up dead sockets
        for ws, t_no in dead_sockets:
            self.disconnect(ws, t_no)


ws_manager = ConnectionManager()
