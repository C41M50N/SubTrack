gcloud auth configure-docker
docker build . -t gcr.io/subtrack-400303/subtrack-web
docker push gcr.io/subtrack-400303/subtrack-web:latest