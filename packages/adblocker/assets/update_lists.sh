#!/bin/sh

# uBlock Origin
curl 'https://cdn.cliqz.com/adblocker/resources/ublock-resources/906c4fac4d23c391085409c1341654e6fe2e67b5d0710560756fd00f2d1f229d/list.txt' | gunzip > ./ublock-origin/resources.txt &

curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt' > ./ublock-origin/annoyances.txt &
curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt' > ./ublock-origin/badware.txt &
curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt' > ./ublock-origin/filters.txt &
curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt' > ./ublock-origin/privacy.txt &
curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt' > ./ublock-origin/resource-abuse.txt &
curl 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt' > ./ublock-origin/unbreak.txt &

# Peter Lowe
curl 'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=0&mimetype=plaintext' > ./peter-lowe/serverlist.txt

# Easylist
curl 'https://easylist.to/easylist/easyprivacy.txt' > ./easylist/easyprivacy.txt &
curl 'https://easylist.to/easylist/easylist.txt' > ./easylist/easylist.txt &
curl 'https://easylist-downloads.adblockplus.org/easylistgermany.txt' > ./easylist/easylistgermany.txt &
curl 'https://easylist-downloads.adblockplus.org/easylist-cookie.txt' > ./easylist/easylist-cookie.txt &

# Fanboy
curl 'https://easylist-downloads.adblockplus.org/fanboy-annoyance.txt' > ./fanboy/annoyance.txt &

# Wait for child processes to terminate
wait
