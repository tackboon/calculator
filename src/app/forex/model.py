from dataclasses import dataclass


@dataclass
class ComodityCache:
  name: str
  price: float
  symbol: str
  updated_at: int
  expired_at: int

@dataclass
class CurrencyCache:
  amount: float
  base: str
  date: str
  rates: dict[str, float]
  updated_at: int
  expired_at: int
  