FROM python:stretch
WORKDIR /code
RUN pip install uvicorn
RUN pip install fastapi
RUN pip install pyjwt
RUN pip install aiofiles
RUN pip install cryptography
COPY ./backend /code
COPY ./frontend/out /frontend/out
RUN git config --global user.email "fans656@yahoo.com" && git config --global user.name "fans656"
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80", "app:app"]
