FROM python:alpine
WORKDIR /code
RUN apk add gcc musl-dev
RUN pip install uvicorn
RUN pip install fastapi
RUN pip install pyjwt
COPY ./backend /code
COPY ./frontend/out /frontend/out
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80", "app:app"]
