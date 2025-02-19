'use strict';
var path = require('path')
  , generators = require('yeoman-generator');
var fs = require('fs');
var find = require('find');
var isVS;
var ClassGenerator = generators.Base.extend({
  constructor: function () {
    generators.Base.apply(this, arguments);
    this.desc('Generate Stateful Service application template');
    this.option('libPath', {
      type: String
      , required: true
    });
    this.option('isAddNewService', {
      type: Boolean
      , required: true
    });
    this.libPath = this.options.libPath;
    this.isAddNewService = this.options.isAddNewService;
    this.option('configfilename', {
      type: String
      , required: true
    });
    this.configfilename = this.options.configfilename;
  },
  prompting: function () {
    var done = this.async();
    var utility = require('../utility');
    var prompts = [{
      type: 'input'
      , name: 'serviceFQN'
      , message: 'Enter the name of service : '
      , validate: function (input) {
        return input ? utility.validateFQN(input) : false;
      }
    }];
    this.prompt(prompts, function (input) {
      this.serviceFQN = input.serviceFQN;
      var parts = this.serviceFQN.split('.')
        , name = parts.pop();
      this.packageName = parts.join('.');
      this.dir = parts.join('/');
      this.serviceName = utility.capitalizeFirstLetter(name.trim());
      if (!this.packageName) {
      this.packageName = "statefulervice";
      this.serviceFQN = "statefulservice." + this.serviceFQN;
      this.dir = this.dir + "/statefulservice";
      }
      done();
    }.bind(this));
  },
  initializing: function () {
    this.props = this.config.getAll();
    this.config.defaults({
      author: '<your name>'
    });
  },
  writing: function () {
    var serviceProjName = this.serviceName;
    var fs = require('fs');
    var data = path.join(process.cwd(), this.configfilename);
    if (fs.existsSync(data)) {
      var words = fs.readFileSync(data);
      var tst = JSON.parse(words);
      isVS = 1;
    }
    else {
      isVS = 0;
    }
    if (!isVS) {
      var appPackage = this.props.projName;
      var servicePackage = this.serviceName + 'Pkg';
      var serviceName = this.serviceName;
      var serviceTypeName = this.serviceName + 'Type';
      var appTypeName = this.props.projName + 'Type';
      var appName = this.props.projName;
      var appPackagePath = this.isAddNewService == false ? path.join(this.props.projName, appPackage) : appPackage;
      var serviceSrcPath = path.join(this.props.projName, serviceProjName);
    }
    else {
      var appPackage = tst.appname;
      var appTypeName = tst.appname + 'Type';
      var appName = tst.appname;
      var servicePackage = this.serviceName + 'Pkg';
      var serviceName = this.serviceName;
      var serviceTypeName = this.serviceName + 'Type';
      var appPackagePath = this.isAddNewService == false ? path.join(tst.appName, appPackage) : appPackage;
    }
      var serviceJarName = (this.serviceName).toLowerCase();
      var serviceMainClass = this.serviceName + 'Service';
      var endpoint = serviceName + 'Endpoint';
      var replicatorEndpoint = serviceName + 'ReplicatorEndpoint';
      var replicatorConfig = serviceName + 'ReplicatorConfig';
      var replicatorSecurityConfig = serviceName + 'ReplicatorSecurityConfig';
      var localStoreConfig = serviceName + 'LocalStoreConfig';
    appPackagePath = appName;
    if (isVS) {
      var serviceProject = path.join(process.cwd(), appPackage, serviceProjName, serviceProjName + '.csproj');
      var codePath = path.join(process.cwd(), serviceProjName, 'PackageRoot', 'Code');
    }
    else {
      var serviceProject = path.join(appPackage, 'src', serviceSrcPath, serviceProjName + '.csproj');
      var codePath = path.join(appPackage, appPackagePath, servicePackage, 'Code');
    }
    var is_Windows = (process.platform == 'win32');
    var is_Linux = (process.platform == 'linux');
    var is_mac = (process.platform == 'darwin');
    var sdkScriptExtension;
    var buildScriptExtension;
    var serviceManifestFile;
    if (is_Windows) {
      sdkScriptExtension = '.ps1';
      buildScriptExtension = '.cmd';
      serviceManifestFile = 'ServiceManifest.xml';
    }
    else {
      sdkScriptExtension = '.sh';
      buildScriptExtension = '.sh';
    }
    if (is_Linux) serviceManifestFile = 'ServiceManifest_Linux.xml';
    if (is_mac) serviceManifestFile = 'ServiceManifest.xml';
    if (isVS) {
      this.fs.copyTpl(
        this.templatePath('service/app/appPackage/servicePackage/' + serviceManifestFile),
        this.destinationPath(path.join(process.cwd(), serviceProjName, 'PackageRoot', 'ServiceManifest.xml')),
        {
          servicePackage: servicePackage,
          serviceTypeName: serviceTypeName,
          serviceName: serviceName,
          serviceProjName: serviceProjName
        }
      );
    }
    else {
      this.fs.copyTpl(
        this.templatePath('service/app/appPackage/servicePackage/' + serviceManifestFile),
        this.destinationPath(path.join(appPackage, appPackagePath, servicePackage, 'ServiceManifest.xml')),
        {
          servicePackage: servicePackage,
          serviceTypeName: serviceTypeName,
          serviceName: serviceName,
          serviceProjName: serviceProjName
        }
      );
    }
    if (!isVS) {
      if (this.isAddNewService == false) {
        this.fs.copyTpl(
          this.templatePath('service/app/appPackage/ApplicationManifest.xml'),
          this.destinationPath(path.join(appPackage, appPackagePath, 'ApplicationManifest.xml')),
          {
            appTypeName: appTypeName,
            servicePackage: servicePackage,
            serviceName: serviceName,
            serviceTypeName: serviceTypeName
          }
        );
      } else {
        var fs = require('fs');
        var xml2js = require('xml2js');
        var parser = new xml2js.Parser();
        fs.readFile(path.join(process.cwd(), appPackage, appPackagePath, 'ApplicationManifest.xml'), function (err, data) {
          parser.parseString(data, function (err, result) {
            if (err) {
              return console.log(err);
            }
            result['ApplicationManifest']['ServiceManifestImport'][result['ApplicationManifest']['ServiceManifestImport'].length] =
              { "ServiceManifestRef": [{ "$": { "ServiceManifestName": servicePackage, "ServiceManifestVersion": "1.0.0" } }] }
            result['ApplicationManifest']['DefaultServices'][0]['Service'][result['ApplicationManifest']['DefaultServices'][0]['Service'].length] =
              { "$": { "Name": serviceName }, "StatefulService": [{ "$": { "ServiceTypeName": serviceTypeName, "InstanceCount": "1" }, "SingletonPartition": [""] }] };

            var builder = new xml2js.Builder();
            var xml = builder.buildObject(result);
            fs.writeFile(path.join(process.cwd(), appPackage, appPackagePath, 'ApplicationManifest.xml'), xml, function (err) {
              if (err) {
                return console.log(err);
              }
            });
          });
        });
      }
    }
    else {
      if (this.isAddNewService == false) {
        this.fs.copyTpl(
          this.templatePath('service/app/appPackage/ApplicationManifest.xml'),
          this.destinationPath(path.join(process.cwd(), appPackage, 'ApplicationPackageRoot', 'ApplicationManifest.xml')),
          {
            appTypeName: appTypeName,
            servicePackage: servicePackage,
            serviceName: serviceName,
            serviceTypeName: serviceTypeName
          }
        );
      }
      else {
        var fs = require('fs');
        var xml2js = require('xml2js');
        var parser = new xml2js.Parser();
        fs.readFile(path.join(process.cwd(), appName, 'ApplicationPackageRoot', 'ApplicationManifest.xml'), function (err, data) {
          parser.parseString(data, function (err, result) {
            if (err) {
              return console.log(err);
            }
            result['ApplicationManifest']['ServiceManifestImport'][result['ApplicationManifest']['ServiceManifestImport'].length] =
              { "ServiceManifestRef": [{ "$": { "ServiceManifestName": servicePackage, "ServiceManifestVersion": "1.0.0" } }] }
            result['ApplicationManifest']['DefaultServices'][0]['Service'][result['ApplicationManifest']['DefaultServices'][0]['Service'].length] =
              { "$": { "Name": serviceName }, "StatefulService": [{ "$": { "ServiceTypeName": serviceTypeName, "InstanceCount": "1" }, "SingletonPartition": [""] }] };

            var builder = new xml2js.Builder();
            var xml = builder.buildObject(result);
            fs.writeFile(path.join(process.cwd(), appPackage, 'ApplicationPackageRoot', 'ApplicationManifest.xml'), xml, function (err) {
              if (err) {
                return console.log(err);
              }
            });
          });
        });
      }
    }
    if (isVS) {
      if (is_Linux) {
        this.fs.copyTpl(
          this.templatePath('service/app/appPackage/servicePackage/Code/entryPoint.sh'),
          this.destinationPath(path.join(process.cwd(), serviceProjName, 'Code', 'entryPoint.sh')),
          {
            serviceProjName: serviceProjName
          }
        );
        this.fs.copyTpl(
          this.templatePath('../../utilityscripts/main/common/dotnet-include.sh'),
          this.destinationPath(path.join(process.cwd(), serviceProjName, 'PackageRoot', 'Code', 'dotnet-include.sh')),
          {
          }
        );
      }
      this.fs.copyTpl(
        this.templatePath('service/app/appPackage/servicePackage/Config/Settings.xml'),
        this.destinationPath(path.join(process.cwd(), serviceProjName, 'PackageRoot', 'Config', 'Settings.xml')),
        {
          serviceName: serviceName
        }
      );
    }
    else {
      if (is_Linux) {
        this.fs.copyTpl(
          this.templatePath('service/app/appPackage/servicePackage/Code/entryPoint.sh'),
          this.destinationPath(path.join(process.cwd(), appPackage, appPackagePath, servicePackage, 'Code', 'entryPoint.sh')),
          {
            serviceProjName: serviceProjName
          }
        );
        this.fs.copyTpl(
          this.templatePath('../../utilityscripts/main/common/dotnet-include.sh'),
          this.destinationPath(path.join(process.cwd(), appPackage, appPackagePath, servicePackage, 'Code', 'dotnet-include.sh')),
          {
          }
        );
      }
      this.fs.copyTpl(
        this.templatePath('service/app/appPackage/servicePackage/Config/Settings.xml'),
        this.destinationPath(path.join(process.cwd(), appPackage, appPackagePath, servicePackage, 'Config', 'Settings.xml')),
        {
          serviceName: serviceName
        }
      );
    }
    if (isVS) {
      this.fs.copyTpl(
        this.templatePath('service/class/ServiceImpl.cs'),
        this.destinationPath(path.join(process.cwd(), serviceProjName, this.serviceName + '.cs')),
        {
          serviceName: serviceName,
          serviceName: this.serviceName,
          appName: appName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/project.csproj'),
        this.destinationPath(path.join(process.cwd(), serviceProjName, this.serviceName + '.csproj')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/Program.cs'),
        this.destinationPath(path.join(process.cwd(), serviceProjName, 'Program.cs')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName,
          appName: appName,
          serviceTypeName: serviceTypeName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/ServiceEventSource.cs'),
        this.destinationPath(path.join(process.cwd(), serviceProjName, 'ServiceEventSource.cs')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName,
          appName: appName,
          serviceTypeName: serviceTypeName
        }
      );
    }
    else {
      this.fs.copyTpl(
        this.templatePath('service/class/ServiceImpl.cs'),
        this.destinationPath(path.join(appPackage, 'src', serviceSrcPath, this.serviceName + '.cs')),
        {
          serviceName: serviceName,
          serviceName: this.serviceName,
          appName: appName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/project.csproj'),
        this.destinationPath(path.join(appPackage, 'src', serviceSrcPath, this.serviceName + '.csproj')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/Program.cs'),
        this.destinationPath(path.join(appPackage, 'src', serviceSrcPath, 'Program.cs')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName,
          appName: appName,
          serviceTypeName: serviceTypeName
        }
      );
      this.fs.copyTpl(
        this.templatePath('service/class/ServiceEventSource.cs'),
        this.destinationPath(path.join(appPackage, 'src', serviceSrcPath, 'ServiceEventSource.cs')),
        {
          serviceName: this.serviceName,
          authorName: this.props.authorName,
          appName: appName,
          serviceTypeName: serviceTypeName
        }
      );
    }
    if (isVS) {
       var fs = require('fs'),
        xml2js = require('xml2js'),
        util = require('util');
        var parser = new xml2js.Parser(),
        xmlBuilder = new xml2js.Builder();
        var i = tst.numofservices;
        var csprojpath = path.join('..\\', this.serviceName, '\\', this.serviceName + '.csproj');
        var data = fs.readFile(path.join(process.cwd(), appName, appName + '.sfproj'));
        parser.parseString(data, function (err, result) {
        result["Project"]["ItemGroup"][3]["ProjectReference"].push(["include"] = csprojpath);
      });
    }
    if (this.isAddNewService == false) {
      this.fs.copyTpl(
        this.templatePath('../../utilityscripts/main/deploy/deploy' + sdkScriptExtension),
        this.destinationPath(path.join(appPackage, 'install' + sdkScriptExtension)),
        {
          appPackage: appPackage,
          appName: appName,
          appTypeName: appTypeName,
          VScodeConfig:"./"+this.configfilename
        }
      );
    }
    if (this.isAddNewService == false) {
      this.fs.copyTpl(
        this.templatePath('../../utilityscripts/main/deploy/un-deploy' + sdkScriptExtension),
        this.destinationPath(path.join(appPackage, 'uninstall' + sdkScriptExtension)),
        {
          appPackage: appPackage,
          appName: appName,
          appTypeName: appTypeName
        }
      );
    }
    if (this.isAddNewService == false) {
      this.fs.copyTpl(
        this.templatePath('../../utilityscripts/main/deploy/upgrade' + sdkScriptExtension),
        this.destinationPath(path.join(appPackage, 'upgrade' + sdkScriptExtension)),
        {
          appPackage: appPackage,
          appName: appName,
          appTypeName: appTypeName
        }
      );
    }
    if (this.isAddNewService == false) {
      this.fs.copyTpl(
        this.templatePath('../../utilityscripts/main/build/build' + buildScriptExtension),
        this.destinationPath(path.join(appPackage, 'build' + buildScriptExtension)),
        {
          serviceProject: serviceProject,
          codePath: codePath,
        }
      );
    }
    else {
      if (!isVS) {
        var nodeFs = require('fs');
        var appendToSettings = null;
        if (is_Linux || is_mac) {
          var appendToSettings = '\n\
          \ndotnet restore $DIR/../' + serviceProject + ' -s https://api.nuget.org/v3/index.json \
          \ndotnet build $DIR/../'+ serviceProject + ' -v normal\
          \ncd ' + '`' + 'dirname $DIR/../' + serviceProject + '`' +
            '\ndotnet publish -o ../../../../' + appName + '/' + appName + '/' + servicePackage + '/Code\
          \ncd -';
        }
        else if (is_Windows) {
          var appendToSettings = '\n\
          \ndotnet restore %~dp0\\..\\' + serviceProject + ' -s https://api.nuget.org/v3/index.json \
          \ndotnet build %~dp0\\..\\'+ serviceProject + ' -v normal\
          \nfor %%F in ("'+ serviceProject + '") do cd %%~dpF\
          \ndotnet publish -o %~dp0\\..\\' + appName + '\\' + appName + '\\' + servicePackage + '\\Code';
        }
        nodeFs.appendFile(path.join(appPackage, 'build' + buildScriptExtension), appendToSettings, function (err) {
          if (err) {
            return console.log(err);
          }
        });
      }
      else {
        var nodeFs = require('fs');
        var appendToSettings = null;
        if (is_Linux || is_mac) {
          var appendToSettings = '\n\
      \ndotnet restore $DIR/../' + serviceProject + ' -s https://api.nuget.org/v3/index.json \
      \ndotnet build $DIR/../'+ serviceProject + ' -v normal\
      \ncd ' + '`' + 'dirname $DIR/../' + serviceProject + '`' +
            '\ndotnet publish -o ../../../../' + appName + '/' + serviceProjName + '/' + 'PackageRoot' + '/Code\
      \ncd -';
        }
        else if (is_Windows) {
          var appendToSettings = '\n\
      \ndotnet restore %~dp0\\..\\' + serviceProject + ' -s https://api.nuget.org/v3/index.json \
      \ndotnet build %~dp0\\..\\'+ serviceProject + ' -v normal\
      \nfor %%F in ("../'+ serviceProject + '") do cd %%~dpF\
      \ndotnet publish -o %~dp0\\..\\' + appName + '\\' + serviceProjName + '\\PackageRoot' + '\\Code';
        }
        nodeFs.appendFileSync(path.join(process.cwd(), 'build' + buildScriptExtension), appendToSettings, function (err) {
          if (err) {
            return console.log(err);
          }
        });
        var p1 = path.join(process.cwd(), serviceProjName, 'PackageRoot', '*');
        var p11 = path.join(process.cwd(), appName, appName, servicePackage);
        var txt1 = '\n' + 'xcopy' + ' ' + '/Y' + ' ' + p1 + ' ' + p11 + ' ' + '/s' + ' ' + '/i';
        fs.appendFileSync(path.join(process.cwd(), 'build' + buildScriptExtension), txt1, function (err) {
          if (err)
            return console.log(err);
        })
      }
    }
    if (is_Linux) {
      if (this.isAddNewService == false) {
        this.fs.copyTpl(
          this.templatePath('../../utilityscripts/main/common/dotnet-include.sh'),
          this.destinationPath(path.join(appPackage, 'dotnet-include.sh')),
          {
          }
        );
      }
    }
    if (!isVS) {
      this.template('service/app/appPackage/servicePackage/Config/_readme.txt', path.join(appPackage, appPackagePath, servicePackage, 'Config', '_readme.txt'));
      this.template('service/app/appPackage/servicePackage/Data/_readme.txt', path.join(appPackage, appPackagePath, servicePackage, 'Data', '_readme.txt'));
    }
    else {
      console.log("in the update");
      var fs = require('fs');
      var xml2js = require('xml2js');
      var convert = require('xml-js');
      var parser = new xml2js.Parser();
      var xmlBuilder = new xml2js.Builder();
      var csprojpath = path.join('..', this.serviceName, this.serviceName + '.csproj');
      fs.readFile(path.join(process.cwd(), appName, appName + '.sfproj'), function (err, data) {
        var result = convert.xml2json(data, { compact: false, spaces: 4 });
        result = JSON.parse(result);
        var l;
        for (l = 0; l < result["elements"][0]["elements"].length; l++) {
          if (result["elements"][0]["elements"][l]["name"] == "ItemGroup") {
            if (result["elements"][0]["elements"][l]["elements"][0]["name"] == "ProjectReference")
              break;
          }
        }
        result["elements"][0]["elements"][l]["elements"][result["elements"][0]["elements"][l]["elements"].length] = {
          "type": "element",
          "name": "ProjectReference",
          "attributes": {
            "Include": csprojpath
          }
        };
      var options = { compact: false };
      var xml = convert.json2xml(result, options);
        fs.writeFile(path.join(process.cwd(), appName, appName + '.sfproj'), xml, function (err) {
          if (err) {
            return console.log(err);
          }
        });
      });
      var array = fs.readFileSync(path.join(process.cwd(), appName + '.sln')).toString().split("\n");
      var guid = generateGuid();
      var count = 0;
      var i;
      for (i in array) {
        if (array[i].includes("EndProject")) {
          count++;
        }
        if (count == 2) {
          var serviceguid = array[i - 1].substring(array[i - 1].indexOf("(") + 1, array[i - 1].indexOf(")"));
        }
        if (count == tst.numofservices + 1) {
          var appendline = 'Project' + '(' + serviceguid + ')' + ' ' + '=' + '"' + this.serviceName + '"' + ',' + ' ' + '"' + this.serviceName + '\\' + this.serviceName + '.csproj' + '"' + ',' + ' "' + '{' + guid + '}"' + '\n' + 'EndProject';
          array[i] = array[i].concat("\n" + appendline + "\n");
          var text = array.join('\n');
          fs.writeFile(path.join(process.cwd(), appName + '.sln'), text, function (err) {
            console.log("write success");
          });
          break;
        }
        console.log(count);
      }
    }
  }
});
module.exports = ClassGenerator;
