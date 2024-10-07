import IP2Location
import re

# Download the bin files from: https://lite.ip2location.com/database-download
# IPV4 Bin: DB3LITEBIN, IPV6 Bin: DB3LITEBINIPV6

class IP2LocationServicer:
  def __init__(self, ipv4_bin_path: str, ipv6_bin_path: str):
    """
    Initialize the IP2Location databases for IPv4 and IPv6.
    
    Parameters:
    - ipv4_bin_path: Path to the IPv4 database binary file.
    - ipv6_bin_path: Path to the IPv6 database binary file.
    """

    self.ipv4_db = IP2Location.IP2Location(ipv4_bin_path)
    self.ipv6_db = IP2Location.IP2Location(ipv6_bin_path)
    
  def get_city_and_country(self, ip: str) -> tuple[str, str]:
    """
    Return city and short country name from the IP address.
    Return '-' for both city and country if the IP address is invalid.

    Parameters:
    - ip: The IP address to look up.

    Returns:
    - A tuple containing the city and country short code.
    """

    city: str = "-"
    country: str = "-"
    
    if self.is_ipv4(ip):
      # IPv4 lookup
      city_record = self.ipv4_db.get_city(ip)
      city = city_record if city_record != "INVALID IP ADDRESS" else "-"
      
      country_record = self.ipv4_db.get_country_short(ip)
      country = country_record if country_record != "INVALID IP ADDRESS" else "-"
    elif self.is_ipv6(ip):
      # IPv6 lookup
      city_record = self.ipv6_db.get_city(ip)
      city = city_record if city_record != "INVALID IP ADDRESS" else "-"
      
      country_record = self.ipv6_db.get_country_short(ip)
      country = country_record if country_record != "INVALID IP ADDRESS" else "-"

    return city, country

  def is_ipv4(self, ip: str) -> bool:
    """
    Check if the provided IP is in IPv4 format.
    
    Parameters:
    - ip: The IP address to validate.
    
    Returns:
    - True if the IP is IPv4, otherwise False.
    """

    return re.match(r"^(\d{1,3}\.){3}\d{1,3}$", ip) is not None
  
  def is_ipv6(self, ip: str) -> bool:
    """
    Check if the provided IP is in IPv6 format.
    
    Parameters:
    - ip: The IP address to validate.
    
    Returns:
    - True if the IP is IPv6, otherwise False.
    """

    return re.match(r"^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$", ip) is not None
  