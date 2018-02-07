FROM node:6.12.0

# add static files; the dynamic files in /app/src (JS and CSS) are provided via
# a volume in the docker-compose.yml file so that we can hot-reload the code
WORKDIR /app
ADD package.json /app/package.json
RUN npm install
ADD public /app/public
ADD docker/run-react.sh /app/server
CMD /app/server

# note that this dockerfile does not expose port 80 since it wouldn't make sense
# to run the webpack dev-server in production; for a production deployment,
# follow the example in project-fortis-pipeline/ops/install-fortis-interfaces.sh
# to create an optimized build and then upload the resulting assets to a static
# file host such as azure blob storage; the ports exposed below are a websocket
# port for hot-reloading and a http port for the webpack dev-server
EXPOSE 35729 3000
ENV PORT="3000"

# a local deployment of the project-fortis-services is set up via docker-compose
# if you wish to use a pre-existing service deployment, just override this
# variable with the transport prefix, hostname, and port of your deployment
# note that the localhost referred to in this environment variable is the host
# that is running docker-compose, not the host inside of the docker container
# this is because the react app is accessed from the users's browser which runs
# on the docker-compose machine, not inside of the docker container
ENV REACT_APP_SERVICE_HOST="http://localhost:8889"

# active directory configuration
# you can set up your own active directory application following the setps here:
# https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/docs/aad-setup.md
# when setting up the application in the "Redirect URLs" configuration ensure to
# add http://localhost:8888 and http://localhost:3000 so that your app works
# via docker-compose but also if run stand-alone via npm start
# the log level determines how much information the passport-active-directory
# module will output; 'info' is usually plenty to trouble-shoot issues
ENV REACT_APP_AD_CLIENT_ID=""

# mapbox configuration
# the tile layer url defines the style of the map that will be used in the site
# any v1 static api url should work here; more information about possible style
# urls is here: https://www.mapbox.com/help/mapbox-with-openlayers/#mapbox-studio-style-or-mapbox-style-url
# for example, here are some nice alternative map styles:
# - standard street map:  https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}
# - custom satellite map: https://api.mapbox.com/styles/v1/erikschlegel/cj82h6wyt9rel2st658r6teto/tiles/256/{z}/{x}/{y}
# the tile server url defines the style for any static maps used in the app, for
# example when displaying the location of an event
ENV REACT_APP_MAPBOX_TILE_LAYER_URL="https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}"
ENV REACT_APP_MAPBOX_TILE_SERVER_URL="https://api.mapbox.com/v4/mapbox.streets"
