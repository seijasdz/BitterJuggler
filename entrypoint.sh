#!/bin/sh

USER_ID=${LOCAL_USER_ID:-1002}
GROUP_ID=${LOCAL_GROUP_ID:-1002}

echo "Starting with UID : $USER_ID"

deluser node \
  && delgroup node \
  && addgroup -S node -g $GROUP_ID \
  && adduser -S -g node -u $USER_ID node

exec su-exec $USER_ID:$GROUP_ID node bin/www
