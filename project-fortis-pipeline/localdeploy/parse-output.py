#!/usr/bin/env python

import fileinput
import json

json_payload = json.loads(''.join(line for line in fileinput.input()))

outputs = json_payload.get('properties', {}).get('outputs', {})
for key, value in outputs.items():
    value = value.get('value', '')
    if key and value:
        # upper-case output key names sometimes get messed up with some
        # characters being flipped to lower-case; correcting for that below
        key = key if key.lower() == key else key.upper()
        print('%s=%s' % (key, value))
