if ( OS_ANDROID ) {
    require('android_actionbar').build({
        window: $.HomeWindow,
        displayHomeAsUp: false,
        // menuItemsBehavior: Ti.Android.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW,
        menuItems: [
            {
                id: 101,
                title: 'Actualizar ubicacion', // L('update_gps')
                icon: Ti.Android.R.drawable.ic_menu_mylocation,
                callback: function(){
                    updateLocation();
                }
            },
            {
                id: 102,
                title: L('logout'),
                icon: Ti.Android.R.drawable.ic_menu_more,//ic_menu_delete,//ic_delete,//ic_menu_close_clear_cancel,
                // icon: 'images/logout.png',
                callback: function(){
                    require('dialogs').openOptionsDialog({
                        options: {
                            buttonNames: [L('accept')],
                            message: L('logout_confirmation'),
                            title: L('app_name')
                        },
                        callback: function(evt){
                            if (evt.index !== evt.source.cancel) {
                                Alloy.Globals.LO.show(L('loader_default'), false);
                                require('session').logout({
                                    success: function(){
                                        Alloy.Globals.LO.hide();
                                        Alloy.Globals.APP.navigatorOpen('login', { navigationWindow: false });
                                    },
                                    error: function(){
                                        Alloy.Globals.LO.hide();
                                    }
                                });
                            }
                        }
                    });
                }
            }
        ]
    });
}

var run = function() {
    Alloy.Globals.LO.show(L('loader_default'), false);
    require('gps_service').init();
    require('http').request({
        timeout: 10000,
        type: 'POST',
        format: 'JSON',
        url: Alloy.Globals.Secrets.backend.url + '/api/v1/users/orders',
        oauth_type: 'userToken',
        success: function(response) {
            var dataItems = [];
            Alloy.Globals.LO.hide();

            if (_.isEmpty(response.delivery_orders)) {
                require('dialogs').openDialog({
                    title: L('app_name'),
                    message: L('delivery_orders_empty')
                });
            } else {
                _.each(response.delivery_orders, function(order) {
                    var dataItem = {
                        raw_data: order,
                        order_internal_guide : { text: 'Guia Interna: ' + order.internal_guide },
                        order_destinatary    : { text: order.destinatary },
                        order_address        : { text: order.address },
                        order_state          : { backgroundColor: getStateColor(order.state) },
                        properties: {
                            searchableText   : order.internal_guide,
                            touchEnabled     : false,
                            accessoryType    : Ti.UI.LIST_ACCESSORY_TYPE_NONE,
                            height           : '95dip'
                        }
                    };

                    dataItems.push(dataItem);
                });

                $.listSearch.hintText = 'Guia Interna';
                $.listSection.setItems(dataItems);
                $.listView.show();
            }
        }
    });
}();

var getStateColor = function (state){
    var color;
    switch (state) {
        case 'pendiente':
            color = Alloy.Globals.colors.soft_red;
            break;
        case 'entregada':
            color = Alloy.Globals.colors.soft_green;
            break;
        case 'devolucion':
            color = Alloy.Globals.colors.soft_orange;
            break;
    }
    return color;
};

var updateLocation = function(){
    Alloy.Globals.LO.show(L('loader_default'), false);
    require('gps_tracker').getCurrentPosition(function(e){
        console.error("GPS DATA: ", e);
        if (!e.error) {
            require('http').request({
                timeout: 10000,
                type: 'POST',
                format: 'JSON',
                oauth_type: 'userToken',
                data: {
                    longitude: e.coords.longitude,
                    latitude: e.coords.latitude,
                    location_type: 0
                },
                url: Alloy.Globals.Secrets.backend.url + '/api/v1/users/updateLocation',
                success: function(response) {
                    console.error("updateLocation response success: ", response);
                    Alloy.Globals.LO.hide();
                    require('dialogs').openDialog({
                        message: 'Ubicacion actualizada con exito',//L('gps_update_success'),
                        title: L('success')
                    });
                },
                failure: function(response) {
                    console.error("updateLocation response error: ", response);
                    Alloy.Globals.LO.hide();
                    require('dialogs').openDialog({
                        message: 'Error al actualizar la ubicacion intenta de nuevo',//L('gps_update_error'),
                        title: L('error')
                    });
                }
            });
        } else {
            Alloy.Globals.LO.hide();
            require('dialogs').openDialog({
                message: e.error,
                title: L('error')
            });
        }
    });
};

var manageDeliver = function(args){
    Alloy.Globals.LO.show(L('loader_default'), false);
    require('gps_tracker').getCurrentPosition(function(e){
        console.error("GPS DATA: ", e);
        if (!e.error) {
            require('http').request({
                timeout: 10000,
                type: 'POST',
                format: 'JSON',
                url: Alloy.Globals.Secrets.backend.url + '/api/v1/delivery_orders/delivered',
                oauth_type: 'userToken',
                data: {
                    delivery_order_internal_guide: args.internal_guide,
                    longitude: e.coords.longitude,
                    latitude: e.coords.latitude
                },
                success: function(response) {
                    Alloy.Globals.LO.hide();
                    args.callback(true);
                },
                failure: function(response) {
                    Alloy.Globals.LO.hide();
                    args.callback(false);
                }
            });
        } else {
            Alloy.Globals.LO.hide();
            require('dialogs').openDialog({
                message: e.error,
                title: L('error')
            });
        }
    });
};

var managePhoto = function(args){
    require('photo_uploader').takePhoto({
        cancel: function(){
            if (args.next_state === 'entregada') {
                manageDeliver({
                    internal_guide: args.internal_guide,
                    callback: function(response){
                        args.callback(response);
                    }
                });
            } else if (args.next_state === 'devolucion') {
                args.callback(false)
            }
        },
        beforeUpload: function(){
            Alloy.Globals.LO.show(L('uploading'), false);
        },
        success: function(cloudinaryResponse){
            Alloy.Globals.LO.hide();
            Ti.API.debug('success cloudinaryResponse: ', JSON.stringify(cloudinaryResponse));

            if (args.next_state === 'entregada') {
                require('http').request({
                    timeout: 10000,
                    type: 'POST',
                    format: 'JSON',
                    oauth_type: 'appToken',
                    data: {
                        image_url: cloudinaryResponse.url,
                        delivery_order_id: args.order_id
                    },
                    url: Alloy.Globals.Secrets.backend.url + '/api/v1/delivery_orders/image',
                    success: function(response) {
                        require('dialogs').openDialog({
                            message: L('photo_uploader_success'),
                            title: L('success')
                        });

                        args.callback(true);
                    },
                    failure: function(response) {
                        require('dialogs').openDialog({
                            message: L('photo_uploader_error_upload'),
                            title: L('error')
                        });
                        args.callback(false);
                    }
                });
            } else if (args.next_state === 'devolucion') {
                args.callback(cloudinaryResponse.url);
            }
        },
        error: function(response){
            Alloy.Globals.LO.hide();
            Ti.API.debug('error response: ', response);
            require('dialogs').openDialog({
                message: L('photo_uploader_error_upload'),
                title: L('error')
            });
            args.callback(false);
        }
    })();
};

var manageDevolution = function(args){
    Alloy.Globals.APP.navigatorOpen('devolution', { navigationWindow: false, params: args });
};

$.listView.addEventListener('itemclick', function(evt) {
    var item = evt.section.getItemAt(evt.itemIndex);
    var bindId = evt.bindId;
    var section = evt.section;
    var itemIndex = evt.itemIndex;

    if (item.raw_data.state === 'pendiente') {
        require('dialogs').openOptionsDialog({
            options: {
                buttonNames: [L('deliver'), L('devolution')],
                message: L('dialog_default'),
                title: L('app_name')
            },
            callback: function(evt){
                if (evt.index === 0) {
                    managePhoto({
                        order_id: item.raw_data.id,
                        internal_guide: item.raw_data.internal_guide,
                        next_state: 'entregada',
                        callback: function(response){
                            if (response === true) {
                                item.raw_data.state = 'entregada';
                            }
                            item.order_state.backgroundColor = getStateColor(item.raw_data.state);
                            section.updateItemAt(itemIndex, item);
                        }
                    });
                } else if(evt.index === 1) {
                    managePhoto({
                        order_id: item.raw_data.id,
                        internal_guide: item.raw_data.internal_guide,
                        next_state: 'devolucion',
                        callback: function(response){
                            image = (response !== true && response !== false) ? response : null
                            Ti.App.Properties.setObject('current_devolution_item_index', itemIndex);
                            manageDevolution({ internal_guide: item.raw_data.internal_guide, order_id: item.raw_data.id, image_url: image });
                        }
                    });
                }
            }
        });
    }

    if (item.raw_data.state === 'entregada') {
        managePhoto({
            order_id: item.raw_data.id,
            internal_guide: item.raw_data.internal_guide,
            next_state: 'entregada',
            callback: function(response){
                if (response === true) {
                    item.raw_data.state = 'entregada';
                }
                item.order_state.backgroundColor = getStateColor(item.raw_data.state);
                section.updateItemAt(itemIndex, item);
            }
        });
    }

    if (item.raw_data.state === 'devolucion') {
        require('dialogs').openDialog({
            message: L('already_in_devolution'),
            title: L('app_name')
        });
    }
});

$.HomeWindow.addEventListener('focus', function(){
    var current_devolution_item_index = Ti.App.Properties.getObject('current_devolution_item_index', null);
    if (current_devolution_item_index !== null) {
        var item = $.listSection.getItemAt(current_devolution_item_index);
        if(item !== null) {
            item.raw_data.state = 'devolucion';
            item.order_state.backgroundColor = getStateColor(item.raw_data.state);
            $.listSection.updateItemAt(current_devolution_item_index, item);
            Ti.App.Properties.removeProperty('current_devolution_item_index');
        }
    }
});
