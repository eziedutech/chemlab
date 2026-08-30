# syntax=docker/dockerfile:1

# Stage 1: build the release binary
FROM rust:1.89-slim-bookworm AS builder
WORKDIR /build
RUN apt-get update \
    && apt-get install -y --no-install-recommends pkg-config build-essential \
    && rm -rf /var/lib/apt/lists/*
# Copy the manifests first and build a dummy binary so that the dependency
# layer is cached and only rebuilt when Cargo.toml or Cargo.lock changes.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src
COPY src ./src
# Touch the real entrypoint so cargo does not reuse the dummy build artifact.
RUN touch src/main.rs && cargo build --release

# Stage 2: runtime
FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --uid 1001 appuser
WORKDIR /app
COPY --from=builder /build/target/release/backrust /usr/local/bin/backrust
USER appuser
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/health || exit 1
CMD ["backrust"]
