variable "project" { }
variable "region" { }
variable "zone" { }
variable "image" { }
variable "db_tier" { }
variable "authorized_networks" {
  default = [
    {
			name  = "sample-gcp-health-checkers-range"
			value = "130.211.0.0/28"
    },
  ]
  type        = list(map(string))
  description = "List of mapped public networks authorized to access to the instances. Default - short range of GCP health-checkers IPs"
}

# secrets
variable "DATABASE_URL" { sensitive = true }
variable "NEXTAUTH_URL" { sensitive = true }
variable "NEXTAUTH_SECRET" { sensitive = true }
variable "GOOGLE_CLIENT_ID" { sensitive = true }
variable "GOOGLE_CLIENT_SECRET" { sensitive = true }
variable "RESEND_API_KEY" { sensitive = true }
