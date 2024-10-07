import hashlib
import hmac
import os

from typing import Optional


# Function to hash a password using SHA-256 and a salt
def hash_password(password: str, salt_length: int = 0, salt: Optional[bytes] = None) -> bytes:
  """
  Hash a password with an optional salt.
  
  Parameters:
  - password: The plain-text password to hash.
  - salt_length: The length of the salt to generate (if salt is not provided).
  - salt: Optional salt to use; if None, a new random salt is generated.
  
  Returns:
  - The salt concatenated with the hashed password.
  """
  
  if salt is None:
    if salt_length > 0:
      salt = os.urandom(salt_length)  # Generate a random salt
    else:
      salt = b""

  hashed_password = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
  return salt + hashed_password


# Function to verify the password against the stored password hash
def verify_password(stored_password: bytes, provided_password: str, salt_length: int = 0) -> bool:
  """
  Verify a provided password against the stored hashed password.
  
  Parameters:
  - stored_password: The stored hash containing the salt and the hashed password.
  - provided_password: The plain-text password provided by the user.
  - salt_length: The length of the salt used in the stored password.
  
  Returns:
  - True if the password matches the hash, False otherwise.
  """

  salt = stored_password[:salt_length]  # Extract the salt from the stored password
  stored_hash = stored_password[salt_length:]  # Extract the stored hash (after the salt)

  # Hash the provided password using the extracted salt
  hashed_provided_password = hashlib.pbkdf2_hmac("sha256", provided_password.encode(), salt, 100000)
    
  # Compare the stored hash with the hash of the provided password using constant-time comparison
  return hmac.compare_digest(stored_hash, hashed_provided_password)
