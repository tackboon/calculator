import IP2Location
import re


class IPLocation:
  def __init__(self, ipv4_bin_path: str, ipv6_bin_path: str):
    self.ipv4_db = IP2Location.IP2Location(ipv4_bin_path)
    self.ipv6_db = IP2Location.IP2Location(ipv6_bin_path)
    
  def get_city_and_country(self, ip: str) -> tuple[str, str]:
    """
    Return city and short country name from ip address.
    Return '-' if ip address is invalid.
    """

    city: str = "-"
    country: str = "-"
    
    # Check ip format
    if self.is_ipv4(ip):
      # Get city name from ipv4
      city_record = self.ipv4_db.get_city(ip)
      city = city_record if city_record != "INVALID IP ADDRESS" else "-"
      
      # Get country name from ipv4
      country_record = self.ipv4_db.get_country_short(ip)
      country = country_record if country_record != "INVALID IP ADDRESS" else "-"
    else:
      # Get city name from ipv6
      city_record = self.ipv6_db.get_city(ip)
      city = city_record if city_record != "INVALID IP ADDRESS" else "-"
      
      # Get country name from ipv6
      country_record = self.ipv6_db.get_country_short(ip)
      country = country_record if country_record != "INVALID IP ADDRESS" else "-"

    return city, country

  def is_ipv4(self, ip: str) -> bool:
    """
    Check is the ip in ipv4 format
    """

    return re.match(r"^(\d{1,3}\.){3}\d{1,3}$", ip) is not None
  