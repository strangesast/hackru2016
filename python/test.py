import bluetooth
import json

devices = bluetooth.discover_devices(duration=20, lookup_names = True)

name = 'HC-06'

for device in devices:
    if name == device[1]:

