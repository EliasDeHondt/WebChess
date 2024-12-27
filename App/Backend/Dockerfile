############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
# Backend build
FROM python:3.9-slim

LABEL maintainer="Elias De Hondt <elias.dehondt@outlook.com>"
LABEL version="1.0"
LABEL description="This is the backend image for the app."

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 5000

CMD ["python", "app.py"]