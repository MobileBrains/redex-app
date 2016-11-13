var camera = Alloy.createController('camera_button', {
    before: function(){
      Alloy.Globals.LO.show(L('uploading'), false);
    },
    success: function(response){
      Alloy.Globals.LO.hide();
      Ti.API.debug('success response: ', response);
      require('dialogs').openDialog({
        message: L('photo_uploader_success'),
        title: L('success')
      });
    },
    error: function(response){
      Alloy.Globals.LO.hide();
      Ti.API.debug('error response: ', response);
      require('dialogs').openDialog({
        message: L('photo_uploader_error_upload'),
        title: L('error')
      });
    }
});
$.HomeWindow.add(camera.getView());