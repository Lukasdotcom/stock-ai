# WIll update automatically if asked to do so
if [ $AUTO_UPDATE == "true" ]; then git pull; fi
nodejs supervisor.mjs &
npm run $TYPE