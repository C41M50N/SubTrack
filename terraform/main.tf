terraform {	
	required_providers {
		google = {
			source = "hashicorp/google"
			version = "5.36.0"
		}
	}
}

provider "google" {
	project = var.project
	region = var.region
	zone = var.zone
}

resource "google_cloud_run_v2_service" "webapp" {
	name = var.project
	location = var.region

	template {
		containers {
			image = var.image
			volume_mounts {
				name       = "cloudsql"
				mount_path = "/cloudsql"
			}

			dynamic "env" {
				for_each = local.secrets
				content {
					name = env.key
					value = env.value.secret_data
				}
			}
		}

		volumes {
			name = "cloudsql"				
			cloud_sql_instance {
				instances = [module.psql-db.instance_connection_name]
			}
		}
	}

	traffic {
		percent = 100
		type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
	}
}

data "google_iam_policy" "noauth" {
	binding {
		role = "roles/run.invoker"
		members = [ "allUsers" ]
	}
}

resource "google_cloud_run_v2_service_iam_policy" "noauth" {
	name 				= google_cloud_run_v2_service.webapp.name
  project     = google_cloud_run_v2_service.webapp.project
	location    = google_cloud_run_v2_service.webapp.location
  policy_data = data.google_iam_policy.noauth.policy_data
}

module "psql-db" {
	source = "terraform-google-modules/sql-db/google//modules/postgresql"
	version = "~> 20.0"

  name                 = var.project
  random_instance_name = true
  database_version     = "POSTGRES_14"
  project_id           = var.project
  zone                 = var.zone
  region               = var.region
  tier                 = var.db_tier
  data_cache_enabled   = true

  deletion_protection = false

  ip_configuration = {
    ipv4_enabled        = true
    private_network     = null
		ssl_mode						= "ENCRYPTED_ONLY"
    allocated_ip_range  = null
    authorized_networks = var.authorized_networks
  }
}

resource "google_cloud_run_domain_mapping" "default" {
	name = "subtrack.cbuff.dev"
	location = google_cloud_run_v2_service.webapp.location
	metadata {
		namespace = var.project
	}
	spec {
		route_name = google_cloud_run_v2_service.webapp.name
	}
}

locals {
	secrets = {
		"DATABASE_URL" = {
			secret_id		= "DATABASE_URL"
			secret_data	= var.DATABASE_URL
		},
		"NEXTAUTH_URL" = {
			secret_id		= "NEXTAUTH_URL"
			secret_data = var.NEXTAUTH_URL
		},
		"NEXTAUTH_SECRET" = {
			secret_id		= "NEXTAUTH_SECRET"
			secret_data = var.NEXTAUTH_SECRET
		},
		"GOOGLE_CLIENT_ID" = {
			secret_id		= "GOOGLE_CLIENT_ID"
			secret_data = var.GOOGLE_CLIENT_ID
		},
		"GOOGLE_CLIENT_SECRET" = {
			secret_id		= "GOOGLE_CLIENT_SECRET"
			secret_data = var.GOOGLE_CLIENT_SECRET
		},
		"RESEND_API_KEY" = {
			secret_id		= "RESEND_API_KEY"
			secret_data = var.RESEND_API_KEY
		},
	}
}

resource "google_secret_manager_secret" "default" {
	for_each = local.secrets
	secret_id = each.value.secret_id
	replication { 
		auto {} 
	}
}

resource "google_secret_manager_secret_version" "default" {
	for_each = local.secrets
	secret = google_secret_manager_secret.default[each.key].id
	secret_data = each.value.secret_data
}
