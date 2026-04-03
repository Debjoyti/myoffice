from datetime import datetime, timedelta, timezone
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="MyOffice Backend")
handler = app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "myoffice-fallback-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


users = {
    "superadmin@demo.com": {
        "id": str(uuid.uuid4()),
        "email": "superadmin@demo.com",
        "password": "password123",
        "name": "Demo SuperAdmin",
        "role": "superadmin",
        "organization_id": str(uuid.uuid4()),
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
}


def create_access_token(user_id: str):
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        for user in users.values():
            if user["id"] == user_id:
                return user
    except JWTError:
        pass
    raise HTTPException(status_code=401, detail="Invalid authentication")


@app.get("/")
async def root():
    return {"status": "ok", "service": "myoffice-backend"}


@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    if user_data.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": user_data.password,
        "name": user_data.name,
        "role": "admin",
        "organization_id": str(uuid.uuid4()),
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users[user_data.email] = new_user
    token = create_access_token(new_user["id"])
    out_user = {k: v for k, v in new_user.items() if k != "password"}
    return {"access_token": token, "token_type": "bearer", "user": out_user}


@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users.get(user_data.email)
    if not user or user["password"] != user_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"])
    out_user = {k: v for k, v in user.items() if k != "password"}
    return {"access_token": token, "token_type": "bearer", "user": out_user}


@app.get("/api/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}
