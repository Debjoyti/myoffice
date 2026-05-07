# Auth API Specification

## 1. POST `/api/v1/auth/login`
**Description:** Authenticate a user and receive an access token.
**Request Body:**
```json
{
  "email": "user@demo.com",
  "password": "password123"
}
```
**Response (200 OK):**
```json
{
  "access_token": "mock-token-<uuid>",
  "token_type": "bearer",
  "user": { ...user_details }
}
```

## 2. POST `/api/v1/auth/register`
**Description:** Register a new user and receive an access token.
**Request Body:**
```json
{
  "email": "newuser@demo.com",
  "password": "password123",
  "name": "New User"
}
```
**Response (200 OK):**
```json
{
  "access_token": "mock-token-<uuid>",
  "token_type": "bearer",
  "user": { ...user_details }
}
```

## 3. GET `/api/v1/auth/me`
**Description:** Retrieve the currently authenticated user's details.
**Headers:** `Authorization: Bearer <token>`
**Response (200 OK):**
```json
{
  "id": "<uuid>",
  "email": "user@demo.com",
  "name": "User Name",
  "role": "admin"
}
```
