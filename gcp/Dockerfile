FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Functions Framework and other base requirements
RUN pip install --no-cache-dir functions-framework

# Copy cloud functions directory
COPY . /app/

# Create entrypoint script
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Set environment variables needed for both functions
ENV PYTHONUNBUFFERED=1

# Expose ports for cloud functions
EXPOSE 8082 8083

# Run the entrypoint script
CMD ["/app/entrypoint.sh"]