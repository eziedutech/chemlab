mod routes;

use std::net::SocketAddr;

use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let app = Router::new()
        .route("/health", get(routes::health::health))
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind the listen address");
    tracing::info!("backrust listening on {addr}");

    axum::serve(listener, app)
        .await
        .expect("server stopped unexpectedly");
}

/// CORS policy.
///
/// Production origins are listed explicitly through ALLOWED_ORIGINS, a comma
/// separated list. The permissive fallback exists only for local development,
/// where no ALLOWED_ORIGINS value is set.
fn cors_layer() -> CorsLayer {
    match std::env::var("ALLOWED_ORIGINS") {
        Ok(raw) if !raw.trim().is_empty() => {
            let origins: Vec<_> = raw
                .split(',')
                .filter_map(|origin| origin.trim().parse().ok())
                .collect();
            tracing::info!("CORS restricted to {} explicit origin(s)", origins.len());
            CorsLayer::new()
                .allow_origin(origins)
                .allow_methods(Any)
                .allow_headers(Any)
        }
        _ => {
            tracing::warn!("ALLOWED_ORIGINS is not set, falling back to permissive CORS");
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        }
    }
}
