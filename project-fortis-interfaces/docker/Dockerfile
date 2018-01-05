FROM node:6.12.0

# a local deployment of the project-fortis-services is set up via docker-compose
# if you wish to use a pre-existing service deployment, just override this
# variable with the transport prefix, hostname, and port of your deployment
# note that the localhost referred to in this environment variable is the host
# that is running docker-compose, not the host inside of the docker container
# this is because the react app is accessed from the users's browser which runs
# on the docker-compose machine, not inside of the docker container
ENV REACT_APP_SERVICE_HOST="http://localhost:8889"

# setting up the feature service is a lengthy process so we provide a shared
# instance for convenience; if you wish to run this service locally, please
# follow the instructions at https://github.com/CatalystCode/featureService and
# then update the value of this environment variable to http://localhost:3035
ENV REACT_APP_FEATURE_SERVICE_HOST="http://fortis-features.eastus.cloudapp.azure.com"

# active directory configuration
# you can set up your own application via https://apps.dev.microsoft.com/
# click "add platform" -> "web" -> make sure that "allow implicit flow" is
# checked (it's the default) and add in the "Redirect URLs" textbox both
# http://localhost:8888 as well as http://localhost:3000 so that your app works
# via docker-compose but also if run stand-alone via npm start
# next up ensure that the "User.Read" permission is added in the section
# "Delegated Permissions" (it's the default); hit "Save" at the bottom of the
# page and you're done
ENV REACT_APP_AD_CLIENT_ID="ee24b790-4962-4372-99f6-b452320d193d"

# mapbox configuration
# you can create a new access token for free at https://www.mapbox.com/signup/
# the tile layer url defines the style of the map that will be used in the site
# any v1 static api url should work here; more information about possible style
# urls is here: https://www.mapbox.com/help/mapbox-with-openlayers/#mapbox-studio-style-or-mapbox-style-url
# for example, here are some nice alternative map styles:
# - standard street map:  https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}
# - custom satellite map: https://api.mapbox.com/styles/v1/erikschlegel/cj82h6wyt9rel2st658r6teto/tiles/256/{z}/{x}/{y}
ENV REACT_APP_MAPBOX_ACCESS_TOKEN=""
ENV REACT_APP_MAPBOX_TILE_LAYER_URL="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}"

WORKDIR /app
ADD package.json /app/package.json
RUN npm install

ADD . /app

EXPOSE 80
ENV PORT="80"
CMD ["npm", "start"]
