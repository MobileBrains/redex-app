var params = arguments[0] || {};
var devolutionReason;
var devolutionReasonNumber;
var reasons = [
    "Seleccione un motivo de devolucion",
    "Direccion Errada",
    "Permanece Cerrado",
    "Cliente no Conocido",
    "Translado Persona",
    "Direccion Incompleta",
    "Translado Empresa",
    "Desorden Publico o Dificil Acceso",
    "Demolido",
    "Rehusado"
];

Alloy.Globals.APP.androidBack($.DevolutionWindow,function(){
    $.DevolutionWindow.close();
});

if (OS_ANDROID) {
    $.devolutionReasonPicker.addEventListener('change', function(evt) {
        devolutionReason = evt.selectedValue[0];
        _.each(reasons, function(data, idx) {
           if (_.isEqual(data, devolutionReason)) {
              devolutionReasonNumber = idx - 1;
              return;
           }
        });
    });
}

_.each(reasons, function(reason) {
    var row = Ti.UI.createPickerRow({ title: reason });
    $.devolutionReasonColumn.addRow(row);
});

$.send.addEventListener('click', function() {
    if (devolutionReasonNumber !== -1 && devolutionReasonNumber !== null && devolutionReasonNumber !== undefined) {
        var observation = $.devolutionObservation.getValue();
        Alloy.Globals.LO.show(L('loader_default'), false);
        require('http').request({
            timeout: 10000,
            type: 'POST',
            format: 'JSON',
            url: Alloy.Globals.Secrets.backend.url + '/api/v1/devolutions',
            oauth_type: 'userToken',
            data: {
                devolution_reason: devolutionReasonNumber,
                observation: observation,
                delivery_order_internal_guide: params.internal_guide,
                delivery_order_id: params.order_id,
                image_url: params.image_url
            },
            success: function(response) {
                Alloy.Globals.LO.hide();
                require('dialogs').openDialog({
                    message: 'Devolucion registrada exitosamente.',
                    title: L('success'),
                    callback: function() { $.DevolutionWindow.close() }
                });
            },
            failure: function(response) {
                Alloy.Globals.LO.hide();
                require('dialogs').openDialog({
                    message: 'Error al registrar la devolucion',
                    title: L('error')
                });
            }
        });
    } else {
        require('dialogs').openDialog({
            message: 'Debe seleccionar un motivo de devolucion.',
            title: L('error')
        });
    }
});