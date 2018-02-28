# Development FAQ

## I'm developing locally, how do I access the Cassandra database?

If you need more low-level access to the Cassandra database, you can execute the
following command to log into a CQL shell:

```
docker-compose exec project_fortis_services /app/cqlsh
```

## I'm developing locally and rows keeps persisting in my Cassandra database?

Volumes (such as Cassandra table data) will stick around between rebuilds. To
perform a clean (discarding table data etc.), use:

```sh
docker-compose down
```

## I'm developing locally and the Project Fortis Spark tests take too long?

You can temporarily disable the tests in project-fortis-spark by adding the
string `"set test in assembly := {}"` before the assembly command on the
instruction in the Dockerfile that runs the sbt build for the spark project.

## I'm getting an error from Twitter about "too many connections"?

If you're getting an error from project-fortis-spark that there are too many
simultaneous Twitter connections, please follow these steps:

1. Create a new set of [Twitter credentials](https://apps.twitter.com/app/new).
2. Make a copy of the [seed-data-twitter.tar.gz](https://github.com/CatalystCode/project-fortis/blob/master/project-fortis-pipeline/localdeploy/seed-data/seed-data-twitter.tar.gz) archive, e.g. suffixing it with your name.
3. Update the `streams.csv` file in your copy of the archive with your Twitter credentials.
4. Commit and push your copy of the archive.
5. Edit the `CASSANDRA_SEED_DATA_URL` variable in the `.env` file to point to your copy of the archive.

## I'm getting an error from Twitter about "HTTP 401"?

If the Twitter connector is giving you a HTTP 401 error (as the own shown in the
snippet below), it is likely that your Docker container's clock got slightly
skewed which leads Twitter to reject the timestamps in the API requests. To
resolve this, restart your computer.

```
project_fortis_spark_1       | <html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>\n<title>Error 401 Unauthorized</title>
project_fortis_spark_1       | </head>
project_fortis_spark_1       | <body>
project_fortis_spark_1       | <h2>HTTP ERROR: 401</h2>
project_fortis_spark_1       | <p>Problem accessing '/1.1/statuses/filter.json'. Reason:
project_fortis_spark_1       | <pre>    Unauthorized</pre>
project_fortis_spark_1       | </body>
project_fortis_spark_1       | </html>
```

## Running docker-compose up complains that it could not find a required file?

If you see an error with one of the Docker containers that relies on a mounted
volume (e.g., the React frontend) that specific files can't be found like shown
in the screenshot below, it is likely that your password has recently changed
and you have to re-share your mount drive with Docker following these steps:
open the Docker settings, go to the "Shared Drives" tab, uncheck the shared
drive, click apply, check the shared drive, click apply again and enter your new
password. The next time you run the Docker container the error will be fixed.

![Screenshot showing docker-compose up mount error](https://user-images.githubusercontent.com/1086421/36483688-d673ff08-16e4-11e8-9677-1a59e118806a.png)

## How do I debug issues with the production deployment script?

If you need to debug any issues with the Fortis ARM template deployment script,
SSH into the FortisDeployVM.

You can now inspect the deployment script's outputs via the following commands:

```sh
sudo less /var/lib/waagent/custom-script/download/0/stdout

sudo less /var/lib/waagent/custom-script/download/0/stderr
```

You can inspect the arguments that were given to the deployment script with the
following command:

```sh
sudo less "$(sudo find /tmp/fortis-deploy-* -name 'fortis-deploy.sh' -print -quit)"
```

## How do I debug issues with the production Spark job?

You can use the Spark UI to debug issues with the Fortis data ingestion pipeline
running in the Kubernetes cluster. The Spark UI is not publicly accessible by
default for security reasons so you need to follow a few steps before you can
access it.

First, SSH into the FortisDeployVM and request a public IP for the Spark UI:

```sh
kubectl expose svc spark-master -n spark --name spark-public --target-port=7077 --target-port=8080 --type LoadBalancer
```

Now wait for the public IP to become available. This should take less than five
minutes. You can use the following script to alert you once the UI is ready:

```sh
while :; do
  spark_ui_ip="$(kubectl get svc -n spark spark-public -o jsonpath='{..ip}')"
  if [ -z "$spark_ui_ip" ]; then
    sleep 20s
  else
    break
  fi
done

echo "Spark UI is now available: http://$spark_ui_ip:7077"
```

Once you're done with the UI, remember to delete its public IP to prevent access
to the UI.

```sh
kubectl delete svc -n spark spark-public
```

## I need to set up a production site for a given list of keywords/etc.

In order to spin up a Fortis deployment that comes pre-configured with a given
set of watchlist terms, streams, site settings, etc. you can leverage the site
import functionality during the deployment, via the `Fortis Site Clone Url` box
in the Fortis deployment wizard.

The site clone URL should point to a tar.gz archive that contains a definition
of your site's settings. Specifically, the archive should contain some CSV files
such as watchlist.csv, sitesettings.csv, streams.csv as well as an import.cql
file that imports these CSV files via the `COPY table FROM csvfile` command. At
deployment time, the Fortis setup will execute the import.cql script and like
that pre-populate your Fortis site.

There are several examples of tar.gz files to bootstrap sites in the [seed-data](https://github.com/CatalystCode/project-fortis/tree/master/project-fortis-pipeline/localdeploy/seed-data)
directory which you can use as a template.
