FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends

# Copy dependency list and install packages first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY src/ ./src

EXPOSE 5000

CMD ["flask", "run", "--host", "0.0.0.0"]
