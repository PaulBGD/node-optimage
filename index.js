var fs = require('fs');
var path = require('path');
var execFile = require('child_process').execFile;

var optimage = module.exports = exports = function (options, done) {

    var inputFile = options.inputFile;
    var outputFile = options.outputFile;
    var extension = options.extension || path.extname(inputFile);
    var verbose = options.verbose;
    var level = options.level;
    var progressive = options.progressive;
    var binPath = '';
    var args = [];

    outputFile = outputFile || inputFile;

    var start = function () {
        execFile(binPath, args, function (err, stdout, stderr) {
            if (err) {
                return done(err, options);
            }

            if (verbose) {
                stdout && console.log(stdout);
                stderr && console.log(stderr);
            }

            done(err, options);
        });
    };

    switch (extension) {

        // 1. Basic optimisation
        // optipng xx.png -out xx2.png
        // optipng xx.png -dir ./img
        // default -o2

        // TODO
        // 2. Removing unnecessary chunks
        // pngcrush -q -rem gAMA -rem alla -rem text image.png image.crushed.png
        // 3. Reducing the colour palette
        // pngnq -f -n 32 -s 3 image.png
        // 4. Re-compressing final image
        // advpng -z -4 image.png
        case '.png':
            binPath = require('optipng-bin').path;
            // OptiPNG can't overwrite without creating a backup file
            // https://sourceforge.net/tracker/?func=detail&aid=3607244&group_id=151404&atid=780913
            function png(err) {
                if (err) {
                    return done(err, options);
                }
                if (options.arg) args = args.concat(options.arg);
                args.push('-strip', 'all', inputFile, "-out", outputFile, '-o', level || 2);
                start();
            }

            if (path.resolve(outputFile) !== path.resolve(inputFile)) {
                fs.exists(outputFile, function (err, exists) {
                    if (err) {
                        return done(err, options);
                    }
                    if (exists) {
                        fs.unlink(outputFile, png);
                    } else {
                        png();
                    }
                });
            } else {
                png();
            }
            break;

        // jpegtran [switches] inputfile outputfile
        case '.jpg':
        case '.jpeg':
            binPath = require('jpegtran-bin').path;
            args.push('-copy', 'none', '-optimize');
            if (progressive) args.push('-progressive');
            if (options.arg) args = args.concat(options.arg);
            args.push('-outfile', outputFile, inputFile)
            start();
            break;

        // maybe support to do a merge with frames?
        // that means we need an array for inputOutput.
        case '.gif':
            binPath = require('gifsicle').path;
            args.push('-o', outputFile, inputFile, '-O', level || 2);
            if (options.arg) arg = args.concat(options.arg);
            start();
            break;

        default:
            throw new Error('Invalid extension');
    }

};

// Task.JS API
exports.run = function (options, done) {

    var dest = options.dest;
    var file = exports.file;

    exports.async.forEach(exports.files, function (inputFile, cb) {
        var outputFile = dest;
        // change to file copy to file
        if (file.isFile(inputFile) && file.isDirname(dest)) {
            var filename = path.basename(inputFile);
            outputFile = path.join(dest, filename);
        }
        options.inputFile = inputFile;
        options.outputFile = outputFile;
        optimage(options, cb);

    }, done);
};
