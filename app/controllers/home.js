var camera = Alloy.createController("camera_button", {
    before: function(){
      Alloy.Globals.LO.show(L('uploading'), false);
    },
    success: function(result){
      Alloy.Globals.LO.hide();
      require("dialogs").openDialog({
        message: L('photo_uploader_success'),
        title: L('success')
      });
    },
    error: function(){
      Alloy.Globals.LO.hide();
      require("dialogs").openDialog({
        message: L('photo_uploader_error_upload'),
        title: L('error')
      });
    }
});
$.HomeWindow.add(camera.getView());