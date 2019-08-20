FROM python:stretch
WORKDIR /code
RUN pip install uvicorn
RUN pip install fastapi
RUN pip install pyjwt
RUN pip install aiofiles
COPY ./backend /code
COPY ./frontend/out /frontend/out
COPY ./secret /code/secret
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80", "app:app"]
