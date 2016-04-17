import redis
import time
import json

queue = redis.StrictRedis(host='localhost', port=6379, db=0)
channel = queue.pubsub()

while True:
    print('writing...')
    queue.publish('position', json.dumps({
        0: {'x':0, 'y':1}
    }))
    time.sleep(1)
