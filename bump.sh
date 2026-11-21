#!/bin/sh
# Uso: ./bump.sh 0.6  -> actualiza la versión visible y la caché de index.html
V="$1"; F=$(TZ=Europe/Madrid date +"%d/%m/%Y %H:%M")
sed -i "s|num: '[^']*', fecha: '[^']*'|num: '$V', fecha: '$F'|" js/version.js
sed -i "s/?v=[0-9.]*\"/?v=$V\"/g" index.html
