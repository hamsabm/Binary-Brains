from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

# Local Modular Imports
from models import database
from routes import auth_routes, dashboard_routes, websocket_routes
from services import simulation_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    simulation_task = asyncio.create_task(simulation_service.global_attack_generator())
    yield
    simulation_task.cancel()

app = FastAPI(
    title="AI Cyber War Room",
    description="Where AI Attacks, Defends, and Explains — In Real Time",
    version="6.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering Modular Routes
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(dashboard_routes.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(dashboard_routes.sim_router, prefix="/simulate", tags=["Simulation"])
app.include_router(websocket_routes.router, tags=["Real-time Stream"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
