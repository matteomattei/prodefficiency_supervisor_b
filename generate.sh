#!/bin/bash
set -e

PROJECT_NAME="${1}"
DESCRIPTION="${2}"
AUTHOR_EMAIL="${3}"
AUTHOR_WEBSITE="${4}"
AUTHOR_NAME="${5}"

PROJECT_FOLDER="$(basename ${PWD})"

if [ ! ${#} -eq  5 ]
then
	echo "Usage: ${0} <project_name> <description> <author_email> <author_website> <author_name>"
	exit 1
fi

cordova create --link-to=www cordova_project com.matteomattei.${PROJECT_FOLDER} "${PROJECT_NAME}"
cd cordova_project
ln -s ../res .
cordova platform add android
cordova plugins add https://github.com/wildabeast/BarcodeScanner.git

# setup config file
sed -i "{s#A sample Apache Cordova.*#${DESCRIPTION}#g}" config.xml
sed -i "{s#<author email=.*#<author email=\"${AUTHOR_EMAIL}\" href=\"${AUTHOR_WEBSITE}\">#g}" config.xml
sed -i "{s#Apache Cordova Team#${AUTHOR_NAME}#g}" config.xml
sed -i '$d' config.xml
cat >> config.xml <<EOF
    <platform name="android">
        <icon src="res/drawable-mdpi/ic_launcher.png" density="mdpi" />
        <icon src="res/drawable-hdpi/ic_launcher.png" density="hdpi" />
        <icon src="res/drawable-xhdpi/ic_launcher.png" density="xhdpi" />
        <icon src="res/drawable-xxhdpi/ic_launcher.png" density="xxhdpi" />
        <icon src="res/drawable-xxxhdpi/ic_launcher.png" density="xxxhdpi" />
     </platform>
</widget>
EOF

cordova build
