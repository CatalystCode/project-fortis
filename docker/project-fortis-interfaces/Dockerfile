FROM node:6.12.0

ADD . /app
WORKDIR /app

RUN npm install

# please set up the project-fortis-services repository locally by following the
# instructions at https://github.com/CatalystCode/project-fortis-services
# basically, you just need to clone the project and run `docker-compose up`
ENV REACT_APP_SERVICE_HOST="http://localhost:8080"

# setting up the feature service is a lengthy process so we provide a shared
# instance for convenience; if you wish to run this service locally, please
# follow the instructions at https://github.com/CatalystCode/featureService and
# then update the value of this environment variable to http://localhost:3035
ENV REACT_APP_FEATURE_SERVICE_HOST="http://fortis-features.eastus.cloudapp.azure.com"

ENV PORT="80"
EXPOSE 80

CMD ["npm", "start"]
