import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt

from app.core.config import settings

# Standar Kriptografi: NIST SP 800-63B & RFC 7519 JWT
PBKDF2_ITERATIONS = 100_000
PBKDF2_ALGORITHM = "sha256"


def hash_pin(pin: str) -> str:
    """
    Menghasilkan cryptographic hash satu arah dari PIN menggunakan PBKDF2-HMAC-SHA256.
    Format: pbkdf2:sha256:100000$<salt_hex>$<hash_hex>
    """
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac(
        PBKDF2_ALGORITHM,
        pin.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS
    )
    return f"pbkdf2:{PBKDF2_ALGORITHM}:{PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """
    Memverifikasi kecocokan PIN dengan hash menggunakan perbandingan konstan
    (secrets.compare_digest) untuk mencegah serangan timing-attack.
    """
    try:
        parts = hashed_pin.split("$")
        if len(parts) != 3:
            return False
        
        algorithm_header, salt_hex, expected_hash_hex = parts
        # Validasi header algoritma
        _, algo, iters_str = algorithm_header.split(":")
        iterations = int(iters_str)
        salt = bytes.fromhex(salt_hex)

        actual_key = hashlib.pbkdf2_hmac(
            algo,
            plain_pin.encode("utf-8"),
            salt,
            iterations
        )
        return secrets.compare_digest(actual_key.hex(), expected_hash_hex)
    except Exception:
        return False


def create_access_token(payload: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Menerbitkan Signed JWT Access Token resmi (RFC 7519) dengan masa berlaku terikat.
    """
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "fina-enterprise-auth",
        "aud": "fina-enterprise-client"
    })

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Mendekode dan memvalidasi integritas kriptografis dari JWT token.
    Melemparkan jwt.PyJWTError jika tanda tangan tidak sah atau token telah kedaluwarsa.
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        issuer="fina-enterprise-auth",
        audience="fina-enterprise-client"
    )
