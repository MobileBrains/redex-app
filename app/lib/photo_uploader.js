function openCamera(mediaOptions) {
    var hasCameraPermissions = Ti.Media.hasCameraPermissions();
    if (hasCameraPermissions === true) {
        console.error("Yes has camera permission");
        Ti.Media.showCamera(mediaOptions);
    } else {
        console.error("No camera permission. Asking for Permission");
        Ti.Media.requestCameraPermissions(function(e) {
            if (e.success === true) {
                openCamera(mediaOptions);
            } else {
                alert("Access denied. No camera permission.");
            }
        });
    }
};

function generateFile(image) {
    var date        = new Date(),
        time        = Math.round(date.getTime() / 1000),
        name        = time + '_photo_stream.' + image.mimeType.split('/')[1],
        dmax        = 640, //desired max in pixels of any one side
        directory   = Ti.Filesystem.applicationDataDirectory,
        file        = Ti.Filesystem.getFile(directory, name);

    if (OS_IOS) {
        // get dimensions for scaling
        var dims = require('scaling_dimensions').calculate(image, dmax);

        // Set and read compress Factor to 100Kb
        var jpgcompressor = require('com.sideshowcoder.jpgcompressor');
        jpgcompressor.setCompressSize(102400);
        jpgcompressor.setWorstCompressQuality(0.70);

        var scaledImage = jpgcompressor.scale(image, dims.width, dims.height);
        var compressedPath = jpgcompressor.compress(scaledImage, name);

        file = Ti.Filesystem.getFile(compressedPath);
    } else {
        var ImageFactory = require('fh.imagefactory');
        file.write(image);
        ImageFactory.rotateResizeImage(file.nativePath, dmax, 70);
    }

    return file;
}

function doUpload(options){
    var buildOnUpload = function(){
        return function(cloudinaryResponse){
            if (!cloudinaryResponse.error) {
                options.success(cloudinaryResponse);
            } else {
                options.failure(cloudinaryResponse.error);
            }
        };
    };

    require('cloudinary').uploader.upload(options.file, buildOnUpload(), {
        api_key: Alloy.Globals.Secrets.cloudinary.api_key,
        api_secret: Alloy.Globals.Secrets.cloudinary.api_secret
    });
}

exports.processPhoto = function(event, callback, failureCallback) {
    var file = generateFile(event);
    doUpload({
        file: file,
        success: callback,
        failure: failureCallback
    });
};

/**
 * Take a photo or select one from the gallery
 * Precondition: assume user is already logged in.
 *               validate before calling this funcion.
 */
exports.takePhoto = function(options) {
    return function(evt) {
        if ( options.beforeTake ) {
            options.beforeTake();
        }

        require('dialogs').openOptionsDialog({
            options: {
                buttonNames: [L('camera'), L('gallery')],
                message: L('photo_uploader_take_photo'),
                cancel: OS_IOS ? 0 : 2
            },
            callback: function(e) {
                if ( e.index === (OS_IOS ? 0 : 2)) { // return if cancelled
                    if ( options.cancel ) {
                        options.cancel();
                    }
                    return;
                }

                var mediaOptions = {
                    mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO],
                    animated : true,
                    autoHide : true,
                    allowEditing : true,
                    showControls : true,
                    success: function (evt) {

                        var afterUploaded = function(result) {

                            if ( result.error ) {
                                if ( options.error ) {
                                    options.error();
                                }
                                return;
                            }

                            if ( options.success ) {
                                options.success(result);
                            }
                        };

                        var onFailure = function(result) {
                            if ( options.error ) {
                                options.error(result);
                            }
                        };

                        if ( options.beforeUpload ) {
                            options.beforeUpload();
                        }

                        exports.processPhoto(evt.media, afterUploaded, onFailure);
                    },
                    error: function (evt) {
                        require('dialogs').openDialog({
                            message: evt.code === Titanium.Media.NO_CAMERA ? L('photo_uploader_device_not_have_camera') : L('photo_uploader_error_take'),
                            title: L('camera')
                        });

                        if ( options.error ) {
                            options.error();
                        }
                    },
                    cancel: function() {
                        if ( options.cancel ) {
                            options.cancel();
                        }
                    }
                };

                if ( e.index === (OS_IOS ? 1 : 0)) { // Camera was selected
                    mediaOptions.saveToPhotoGallery = true;
                    openCamera(mediaOptions);
                } else if ( e.index === (OS_IOS ? 2 : 1)) {
                    Ti.Media.openPhotoGallery(mediaOptions);
                }
            }
        });
    };
};
