var args = arguments[0] || {};

var clickHandler = (function(_args) {
    return function(evt){
        var beforeUpload = (function(_callback){
            return function() {
                if ( _callback ) {
                    _callback();
                }
            };
        })(_args.before);

        var onSuccess = (function(_callback){
            return function(result){
                if ( _callback ) {
                    _callback(result);
                }
            };
        })(_args.success);

        var onFailure = (function(_callback){
            return function(result){
                if ( _callback ) {
                    _callback(result);
                }
            };
        })(_args.error);

        require('photo_uploader').takePhoto({
            beforeUpload: beforeUpload,
            success:      onSuccess,
            error:        onFailure
        })();
    };
})(args);

$.cameraContent.addEventListener('click', clickHandler);