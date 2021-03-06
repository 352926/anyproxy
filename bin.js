#!/usr/bin/env node

var program     = require('commander'),
    color       = require('colorful'),
    fs          = require("fs"),
    path        = require("path"),
    npm         = require("npm"),
    packageInfo = require("./package.json");

program
    .version(packageInfo.version)
    .option('-u, --host [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https, http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-f, --file [value]', 'save request data to a specified file, will use in-memory db if not specified')
    .option('-r, --rule [value]', 'path for rule file,')
    .option('-g, --root [value]', 'generate root CA')
    .option('-l, --throttle [value]', 'throttle speed in kb/s (kbyte / sec)')
    .option('-i, --intercept', 'intercept(decrypt) https requests when root CA exists')
    .option('-c, --clear', 'clear all the tmp certificates')
    .option('install', 'install node modules')
    .parse(process.argv);

if(program.clear){
    require("./lib/certMgr").clearCerts(function(){
        console.log( color.green("all certs cleared") );
        process.exit(0);
    });

}else if(program.root){
    require("./lib/certMgr").generateRootCA(function(){
        process.exit(0);
    });
}else if(program.install){
    npm.load({
        "prefix": process.env.NODE_PATH + '/anyproxy/'
    }, function (er) {
        npm.commands.install(program.args || [], function (er, data) {
            if(er)throw er;
        })
        npm.registry.log.on("log", function (message) {
        })
    });
}else{
    var proxy = require("./proxy.js");
    var ruleModule;

    if(program.rule){
        var ruleFilePath = path.resolve(process.cwd(),program.rule);
        try{
            if(fs.existsSync(ruleFilePath)){
                ruleModule = require(ruleFilePath);
                console.log("rule file loaded :" + ruleFilePath);
            }else{
                console.log(ruleFilePath);
                console.log(color.red("can not find rule file"));
            }
        }catch(e){
            console.log("failed to load rule file :" + e.toString());
        }
    }

    new proxy.proxyServer({
        type                : program.type,
        port                : program.port,
        hostname            : program.host,
        dbFile              : program.file,
        throttle            : program.throttle,
        rule                : ruleModule,
        disableWebInterface : false,
        interceptHttps      : program.intercept
    });
}
