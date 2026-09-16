import base64
import hashlib
import hmac
import json
import time
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

bearer_scheme = HTTPBearer(auto_error=True)
optional_bearer_scheme = HTTPBearer(auto_error=False)


def _encode_part(value: object) -> str:
    raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _decode_part(value: str) -> dict:
    padding = "=" * (-len(value) % 4)
    return json.loads(base64.urlsafe_b64decode((value + padding).encode()))


def create_access_token(personnel: dict) -> str:
    settings = get_settings()
    now = int(time.time())
    header = _encode_part({"alg": "HS256", "typ": "JWT"})
    payload = _encode_part({
        "sub": personnel["personnel_id"],
        "personnel_type": personnel["personnel_type"],
        "role": personnel.get("role"),
        "manager_id": personnel.get("manager_id"),
        "iat": now,
        "exp": now + settings.JWT_EXPIRE_MINUTES * 60,
    })
    message = f"{header}.{payload}".encode()
    signature = hmac.new(settings.JWT_SECRET.encode(), message, hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{header}.{payload}.{encoded_signature}"


def _decode_access_token(token: str) -> dict:
    settings = get_settings()
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Format token tidak valid")

    message = f"{parts[0]}.{parts[1]}".encode()
    expected = hmac.new(settings.JWT_SECRET.encode(), message, hashlib.sha256).digest()
    supplied = base64.urlsafe_b64decode((parts[2] + "=" * (-len(parts[2]) % 4)).encode())
    if not hmac.compare_digest(expected, supplied):
        raise ValueError("Signature token tidak valid")

    payload = _decode_part(parts[1])
    if not payload.get("sub") or not payload.get("personnel_type"):
        raise ValueError("Isi token tidak lengkap")
    if int(payload.get("exp", 0)) <= int(time.time()):
        raise ValueError("Token sudah kedaluwarsa")
    return payload


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_personnel(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    try:
        return _decode_access_token(credentials.credentials)
    except (ValueError, TypeError, json.JSONDecodeError, base64.binascii.Error):
        raise _invalid_credentials()


def get_optional_personnel(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer_scheme),
) -> Optional[dict]:
    if credentials is None:
        return None
    try:
        return _decode_access_token(credentials.credentials)
    except (ValueError, TypeError, json.JSONDecodeError, base64.binascii.Error):
        raise _invalid_credentials()


def require_roles(*allowed_roles: str) -> Callable:
    def dependency(personnel: dict = Depends(get_current_personnel)) -> dict:
        if personnel.get("personnel_type") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role tidak memiliki akses ke endpoint ini",
            )
        return personnel

    return dependency


def require_tps_operator(personnel: dict = Depends(get_current_personnel)) -> dict:
    is_admin = personnel.get("personnel_type") == "admin"
    is_operational_staff = (
        personnel.get("personnel_type") == "staff"
        and personnel.get("role") == "staf_operasional"
    )
    if not (is_admin or is_operational_staff):
        raise HTTPException(status_code=403, detail="Role tidak memiliki akses operasional TPS")
    return personnel


def require_tps_viewer(personnel: dict = Depends(get_current_personnel)) -> dict:
    is_manager = personnel.get("personnel_type") == "manager"
    if is_manager:
        return personnel
    return require_tps_operator(personnel)


def require_inventory_operator(personnel: dict = Depends(get_current_personnel)) -> dict:
    is_admin = personnel.get("personnel_type") == "admin"
    is_warehouse_staff = (
        personnel.get("personnel_type") == "staff"
        and personnel.get("role") == "staf_gudang"
    )
    if not (is_admin or is_warehouse_staff):
        raise HTTPException(status_code=403, detail="Role tidak memiliki akses pengelolaan barang")
    return personnel


def require_office_area(area: str) -> Callable:
    allowed = {
        "documents": {"admin", "manager", "staf_operasional"},
        "correspondence": {"admin", "manager", "staf_operasional"},
        "workflow": {"admin", "manager", "staf_operasional"},
        "communication": {"admin", "manager", "staf_operasional", "staf_gudang"},
        "shifts": {"admin", "manager", "staf_gudang"},
        "notifications": {"admin", "manager", "staf_gudang"},
    }

    def dependency(personnel: dict = Depends(get_current_personnel)) -> dict:
        personnel_type = personnel.get("personnel_type")
        capability = personnel_type if personnel_type != "staff" else personnel.get("role")
        if capability not in allowed.get(area, set()):
            raise HTTPException(status_code=403, detail=f"Role tidak memiliki akses area {area}")
        return personnel

    return dependency
