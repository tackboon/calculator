import hashlib
import os

from typing import Optional


# Function to hash a password using SHA-256 and a salt
def hash_password(password: str, salt_length: int = 0, salt: Optional[bytes] = None) -> bytes:
  # Generate a random salt if none is provided and salt length is specified
  if salt is None:
    if salt_length > 0:
      salt = os.urandom(salt_length)
    else:
      salt = b""

  hashed_password = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
  return salt + hashed_password


# Function to verify the password
def verify_password(stored_password: bytes, provided_password: str, salt_length: int = 0) -> bool:
  salt = b""
  
  # Split the salt from the stored hash if salt length is specified
  if salt_length > 0:
    salt = stored_password[:salt_length]

  return hash_password(provided_password, salt_length, salt) == stored_password
