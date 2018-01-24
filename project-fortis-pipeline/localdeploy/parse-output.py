#!/usr/bin/env python

import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument('file_to_parse', type=argparse.FileType('r'))
args = parser.parse_args()

json_payload = json.load(args.file_to_parse)

outputs = json_payload.get('properties', {}).get('outputs', {})
for key, value in outputs.items():
    value = value.get('value', '')
    if key and value:
        # upper-case output key names sometimes get messed up with some
        # characters being flipped to lower-case; correcting for that below
        key = key if key.lower() == key else key.upper()
        print('%s=%s' % (key, value))
