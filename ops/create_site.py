#!/usr/bin/env python
"""Script to create a new Fortis site via GraphQL.
"""

from json import dumps
try:
    from urllib.request import Request, urlopen
except ImportError:
    from urllib2 import Request, urlopen


def _main(graphql_service_host, site_name, site_type):
    mutation = '''mutation {
      createSite(
        input: {
          siteType: "%s",
          targetBbox: [],
          defaultZoomLevel: 8,
          logo: "",
          title: "",
          name: "%s",
          defaultLocation: [],
          defaultLanguage: "en",
          supportedLanguages: ["en"]
        }
      ) { name }
    }''' % (site_type, site_name)

    url = '%s/api/settings' % graphql_service_host
    headers = {'Content-Type': 'application/json'}
    body = dumps({'query': mutation}).encode('utf-8')

    request = urlopen(Request(url, body, headers))
    response = request.read().decode('utf-8')
    print(response)


def _cli():
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('graphql_service_host')
    parser.add_argument('site_name')
    parser.add_argument('site_type')
    args = parser.parse_args()

    _main(args.graphql_service_host, args.site_name, args.site_type)


if __name__ == '__main__':
    _cli()
