#!/usr/bin/env python
#

from network import WLAN
from mqtt import MQTTClient
from pysense import Pysense
from LTR329ALS01 import LTR329ALS01
import pycom
import machine
import time
import sys
import json

WAKE_REASON_PUSH_BUTTON = 2 # PIC MCU wake up reason

# load variables
with open('config.json', 'r') as f:
    config = json.load(f)

wifi_ssid = config["wifi_ssid"]
wifi_key = config["wifi_key"]
mqtt_server = config["mqtt_server"]
mqtt_port = config["mqtt_port"]
subscribe_key = config["subscribe_key"]
publish_key = config["publish_key"]
client_id = config["client_id"]
channel_name = config["channel_name"]
lux_threshold = config["lux_threshold"]

pycom.heartbeat(False) # disable periodic LED flashing


# setup wifi client
wlan = WLAN(mode=WLAN.STA)
wlan.connect(wifi_ssid, auth=(WLAN.WPA2, wifi_key), timeout=5000)
while not wlan.isconnected():
    machine.idle() # clock gating to reduce power consumption
print("Connected to WiFi\n")
pycom.rgbled(0x00FF00)
time.sleep(1)
pycom.rgbled(0x000000)

py = Pysense()

if py.get_wake_reason() == WAKE_REASON_PUSH_BUTTON:
    print("Stopping program")
    sys.exit()

# 1X gain is 1lux to 64k lux range. Measurement over 500ms with samples every 100ms
lt = LTR329ALS01(py, gain = LTR329ALS01.ALS_GAIN_1X, integration = LTR329ALS01.ALS_INT_100, rate = LTR329ALS01.ALS_RATE_500)
time.sleep(0.5) # give time to sensor init

# light() returns blue & red wavelength lux values as tuple
if lt.light() > (lux_threshold, lux_threshold):
    pycom.rgbled(0xFF0000)
    time.sleep(3)
    pycom.rgbled(0x000000)

# Connect to MQTT gateway and publish luxValue (blue wavelength only)
mqtt_msg = {'clientId': client_id, 'luxValue': lt.light()[0]}
client = MQTTClient(publish_key + "/" + subscribe_key + "/" + client_id, mqtt_server, port=mqtt_port)
client.connect()
client.publish(topic=channel_name, msg=json.dumps(mqtt_msg))
client.disconnect()


py.setup_sleep(60)
py.go_to_sleep()
