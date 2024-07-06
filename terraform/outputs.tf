output "webapp-url" {
  value = google_cloud_run_v2_service.webapp.uri
}

output "db-conn" {
  value = format("postgres://default:%s@%s/default?sslmode=require", module.psql-db.generated_user_password, module.psql-db.public_ip_address)
  sensitive = true
}