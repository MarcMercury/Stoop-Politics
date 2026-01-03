# Stoop Politics DNS Records (GoDaddy)
# Domain: stooppolitics.com
# Last updated: December 14, 2025
# ================================================

## A Record (Points to Vercel)
| Type | Name | Data | TTL |
|------|------|------|-----|
| A | @ | 76.76.21.21 | 1 Hour |

## Nameservers (GoDaddy - Cannot modify)
| Type | Name | Data | TTL |
|------|------|------|-----|
| NS | @ | ns69.domaincontrol.com. | 1 Hour |
| NS | @ | ns70.domaincontrol.com. | 1 Hour |

## CNAME Records
| Type | Name | Data | TTL | Purpose |
|------|------|------|-----|---------|
| CNAME | www | cname.vercel-dns.com. | 1 Hour | Vercel hosting |
| CNAME | pay | paylinks.commerce.godaddy.com. | 1 Hour | GoDaddy payments |
| CNAME | _domainconnect | _domainconnect.gd.domaincontrol.com. | 1 Hour | GoDaddy domain connect |

## SOA Record
| Type | Name | Data | TTL |
|------|------|------|-----|
| SOA | @ | Primary nameserver: ns69.domaincontrol.com. | 1 Hour |

## MX Records (Email - Resend/Amazon SES)
| Type | Name | Data | Priority | TTL | Purpose |
|------|------|------|----------|-----|---------|
| MX | @ | inbound-smtp.us-east-1.amazonaws.com. | 10 | 1 Hour | Resend receiving |
| MX | send | feedback-smtp.us-east-1.amazonses.com. | 10 | 1 Hour | Resend sending |

## TXT Records
| Type | Name | Data | TTL | Purpose |
|------|------|------|-----|---------|
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtX0MjzG4UD4aZ8JW0FQQGFLJTGl257sZOTuWY+5OJsoglz3jML2BT7hmIZwDB4DezSMGl0zku7WKAdtFDtDfuovRieV4h6PqXwWHD/UVvtZdX7V8dGrj6aVe5vy368ZUMiXvNFu3CXkC/qQXtXdo5y5Hyt13Qt492q4dXIq8qQQIDAQAB | 1 Hour | Resend DKIM |
| TXT | mx._domainkey | k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC2ryP0qeu6LwiTwlxP0vCwtXyQWS20HBZYZrcSbjzUIlOGUvQq53vRH+YPVaRIre24+quru3k9eQ+uO3GRt/zVNqydlJakqNdhq6FzKNRysSisphykjLDBproymudlWV88oSUQPMNOZwAZOqIkBYqqKNp7ExRgsgbEQnhUb1QD0wIDAQAB | 1 Hour | Old DKIM (can delete) |
| TXT | send | v=spf1 include:amazonses.com ~all | 1 Hour | Resend SPF |
| TXT | _dmarc | v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net; | 1 Hour | Email security |

## Notes
- Domain is hosted on GoDaddy
- Website is deployed on Vercel
- Email is handled by Resend (via Amazon SES)
- The `mx._domainkey` TXT record is from old Mailgun setup - can be deleted if not using Mailgun
