from time import sleep
import myo
from myo import init, Hub, DeviceListener
import pymongo
from pymongo import MongoClient
import redis
import json

r = redis.Redis('samzagrobelny.com')
queue = redis.StrictRedis(host='samzagrobelny.com', port=6379, db=0)
channel = queue.pubsub()


class Listener(DeviceListener):
    def on_pair(self, myo, timestamp, firmware_version):
        print("PAIRED")

    def on_unpair(self, myo, timestamp):
        print("UNPAIRED")

    #def on_orientation_data(self, myo, timestamp, quat):
        #print(quat.x, quat.y, quat.z, quat.w)
        #print(quat.z)

    def on_pose(self, myo, timestamp, pose):
        print(pose)
        if pose=="fist":
            print("FIRED!")
            
            queue.publish('fire', json.dumps({
                'fire':True
            }))
    #def on_accelerometer_data(self,myo, timestamp, acceleration):
        # Do something with acceleration data

    def on_gyroscope_data(self, myo, timestamp, gyroscope):
        queue.publish('position', json.dumps({
            'th':gyroscope.y
        })) 
        #print(gyroscope.y)

        
myo.init('C:/myo-sdk-win-0.9.0/bin')
hub = Hub()
hub.run(1000, Listener())
try:
    while True:
        sleep(0.5)
        
except KeyboardInterrupt:
    print('\nQuit')
finally:
    hub.shutdown()  # !! crucial
