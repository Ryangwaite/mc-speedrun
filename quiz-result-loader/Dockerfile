FROM golang:1.17-alpine AS builder

WORKDIR /build

COPY config/ config/
COPY deadletter/ deadletter/
COPY extract/ extract/
COPY load/ load/
COPY logfmt/ logfmt/
COPY python-env/ python-env/
COPY quiz/ quiz/
COPY subscribe/ subscribe/
COPY worker/ worker/
COPY main.go .
COPY go.mod .
COPY go.sum .

RUN go build -o quiz-result-loader

FROM alpine:3.15

WORKDIR /

COPY --from=builder /build/quiz-result-loader .
COPY config.ini .

ENTRYPOINT [ "./quiz-result-loader" ]
