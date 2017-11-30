FROM node:6.12.0

ADD . /app
WORKDIR /app

# a local deployment of the project-fortis-services is set up via docker-compose
# if you wish to use a pre-existing service deployment, just override this
# variable with the transport prefix, hostname, and port of your deployment
ENV REACT_APP_SERVICE_HOST="http://localhost:8080"

# setting up the feature service is a lengthy process so we provide a shared
# instance for convenience; if you wish to run this service locally, please
# follow the instructions at https://github.com/CatalystCode/featureService and
# then update the value of this environment variable to http://localhost:3035
ENV REACT_APP_FEATURE_SERVICE_HOST="http://fortis-features.eastus.cloudapp.azure.com"

RUN npm install \
 && npm run build \
 && npm install -g pushstate-server

EXPOSE 80

CMD ["pushstate-server", "./build", "80"]
