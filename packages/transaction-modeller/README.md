# Transaction Modeller

## Commands

### Build docker image

```sh
docker build -t transaction-modeller .
```

### Run docker container with prior image

```sh
docker run -p 8989:8888 --rm -v $(pwd)/notebooks:/home/jovyan/work transaction-modeller
```
