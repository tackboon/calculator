from dataclasses import dataclass


@dataclass
class ComodityCache:
  name: str
  price: float
  symbol: str
  updated_at: int
