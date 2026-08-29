import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.eta_service import eta_service
from app.schemas.eta import StationETAResponse, TrainLiveETA
from app.core.websocket_manager import ws_manager

router = APIRouter(tags=["ETA"])


@router.get("/station/{station_code}", response_model=StationETAResponse)
def get_station_eta(station_code: str):
    """Returns live arriving/departing train board with confidence intervals & explainability."""
    result = eta_service.get_station_live_board(station_code)
    return result


@router.get("/train/{train_no}", response_model=TrainLiveETA)
def get_train_eta(train_no: str, db: Session = Depends(get_db)):
    """Returns detailed live running status, intermediate stop ETAs, and physics+ML delay analysis."""
    result = eta_service.compute_live_train_eta(train_no, db=db)
    if not result:
        raise HTTPException(status_code=404, detail=f"Train {train_no} not found or inactive")
    return result


@router.websocket("/ws/eta/{train_no}")
async def websocket_train_eta(websocket: WebSocket, train_no: str):
    """
    Real-time push WebSocket for live ETA updates, telemetry changes,
    and delay explainability strings.
    """
    await ws_manager.connect(websocket, train_no)
    try:
        # Send immediate initial state
        initial_eta = eta_service.compute_live_train_eta(train_no)
        if initial_eta:
            await websocket.send_json({"type": "INIT_ETA", "data": initial_eta})

        while True:
            # Keep-alive heartbeat and receive client pings/requests
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=15.0)
                # If client requests a refresh
                if "refresh" in data.lower():
                    updated = eta_service.compute_live_train_eta(train_no)
                    if updated:
                        await websocket.send_json({"type": "UPDATE_ETA", "data": updated})
            except asyncio.TimeoutError:
                # Periodic live tick push every 15s
                updated = eta_service.compute_live_train_eta(train_no)
                if updated:
                    await websocket.send_json({"type": "TICK_ETA", "data": updated})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, train_no)
    except Exception:
        ws_manager.disconnect(websocket, train_no)
