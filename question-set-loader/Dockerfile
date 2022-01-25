FROM golang:1.17-alpine AS builder

WORKDIR /build

COPY auth/ auth/
COPY config/ config/
COPY handler/ handler/
COPY logfmt/ logfmt/
COPY quiz/ quiz/
COPY main.go .
COPY go.mod .
COPY go.sum .

RUN go build -o question-set-loader

FROM alpine:3.15

WORKDIR /

COPY --from=builder /build/question-set-loader .
COPY config.ini .

ENTRYPOINT [ "./question-set-loader" ]
