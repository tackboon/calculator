import json
import requests

from src.common.logger import BasicJSONFormatter, create_logger

class SendEmailService:
  def __init__(self, log_path: str, base_link: str, send_grid_token: str, sender_email: str):
    """
    Initialize the send email service.
    
    Parameters:
    - base_link: Base url of reset password link
    - log_path: Path where error log will be store
    - send_grid_token: Auth token from SendGrid (https://sendgrid.com)
    - sender_email: Email to use for sending email to recipient
    """

    self.base_link = base_link
    self.sender_email = sender_email
    self.basic_url = "https://api.sendgrid.com/v3/mail/send"
    self.headers = {
      "Authorization": f"Bearer {send_grid_token}",
      "Content-Type": "application/json",
    }

    # Configure the logger with a JSON format for logging error
    self.logger = create_logger("email", "info", log_path, 
                                BasicJSONFormatter(datefmt="%Y-%m-%d %H:%M:%S"))


  def send_email(self, emails: list[str], subject: str, content: str) -> bool:
    """
    Send a basic email to multiple recipients.
    Return true if successfully sent, else return false.
    
    Parameters:
    - emails: Recipients' email
    - subject: email's subject
    - content: email's content
    """

    # Prepare the recipients' list
    to_emails = [{"email": email} for email in emails]

    # Email data for SendGrid API
    data = {
      "personalizations": [
        {
          "to": to_emails
        }
      ],
      "from": {
        "email": self.sender_email
      },
      "subject": subject,
      "content": [
        {
          "type": "text/plain",
          "value": content
        }
      ]
    }

    # Send POST request to SendGrid API
    response = requests.post(self.basic_url, headers=self.headers, data=json.dumps(data))

    # Handle response
    if response.status_code == 202:
      self.logger.info(f"Successfully sent email to {emails}.")
      return True
    
    self.logger.error(
      f"Failed to send email to {emails}. Status code: {response.status_code}. Response: {response.text}"
    )
    return False

  def get_reset_password_template(self, reset_link: str, expiry: str) -> tuple[str, str]:
    """
    Return reset password email template.

    Return:
    - subject
    - content
    """

    subject = "Reset Your Password"
    content = f"""
    Hello,

    We received a request to reset your password. You can reset your password by clicking on the below: 
    {reset_link}

    If you did not request a password reset, you can safely ignore this email.
    This link will expire on {expiry}.
    """

    return subject, content
  
  def get_otp_template(self, code: str, expiry: str) -> tuple[str, str]:
    """
    Return OTP email template.

    Return:
    - subject
    - content
    """

    subject = "Your One-Time Password (OTP)"
    content = f"""
    Hello,

    Your One-Time Password (OTP) is: {code}

    Please use this OTP to complete your request. 
    This OTP will expire on {expiry}.

    If you did not request this OTP, please ignore this message.
    """

    return subject, content
  