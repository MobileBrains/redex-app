/**
 * image: image as blob
 * dmax: desired max in pixels of any one side
 */
exports.calculate = function(image, dmax) {
    var w;
    var h;
    var ratio;

    if ( image.width > image.height ) {
        ratio = dmax/image.width;
        w = dmax;
        h = image.height * ratio;
    } else {
        ratio = dmax/image.height;
        h = dmax;
        w = image.width * ratio;
    }

    return {
        width:  w,
        height: h
    };
};