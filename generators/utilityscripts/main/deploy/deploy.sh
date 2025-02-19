#!/bin/bash
uninstall () {
    echo "Uninstalling App as installation failed... Please try installation again."
    ./uninstall.sh
    exit
}

cd `dirname $0`
path="<%= VScodeConfig%>"

if test -f "$path"; then
    AppPath = <%= appPackage %>+'/'+<%= appPackage %>;
    ManifestSrcPath=<%= appPackage %>+'/ApplicationPackageRoot/ApplicationManifest.xml';
    ManifestDstPath=$AppPath
    cp  ManifestSrcPath  ManifestDstPath
fi
sfctl application upload --path <%= appPackage %> --show-progress
if [ $? -ne 0 ]; then
  uninstall
fi

sfctl application provision --application-type-build-path <%= appPackage %>
if [ $? -ne 0 ]; then
  uninstall
fi

sfctl application create --app-name fabric:/<%= appName %> --app-type <%= appTypeName %> --app-version 1.0.0
if [ $? -ne 0 ]; then
  uninstall
fi

cd -