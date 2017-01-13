if ( OS_ANDROID ) {
    require('android_actionbar').build({
        window: $.HomeWindow,
        displayHomeAsUp: false,
        menuItems: [{
            id: 101,
            title: L('logout'),
            icon: 'images/logout.png',
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
        }]
    });
}

var run = function() {
    Alloy.Globals.LO.show(L('loader_default'), false);
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
                        order_adderss        : { text: order.adderss },
                        order_state          : { backgroundColor: getStateColor(order.state) },
                        properties: {
                            touchEnabled     : false,
                            accessoryType    : Ti.UI.LIST_ACCESSORY_TYPE_NONE,
                            height           : '95dip'
                        }
                    };

                    dataItems.push(dataItem);
                });

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

var manageDeliver = function(args){
    Alloy.Globals.LO.show(L('loader_default'), false);
    require('http').request({
        timeout: 10000,
        type: 'POST',
        format: 'JSON',
        url: Alloy.Globals.Secrets.backend.url + '/api/v1/delivery_orders/delivered',
        oauth_type: 'userToken',
        data: {
            delivery_order_internal_guide: args.internal_guide
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
};

var managePhoto = function(args){
    require('photo_uploader').takePhoto({
        cancel: function(){
            if (args.state !== 'entregada') {
                manageDeliver({
                    internal_guide: args.internal_guide,
                    callback: function(response){
                        args.callback(response);
                    }
                });
            }
        },
        beforeUpload: function(){
            Alloy.Globals.LO.show(L('uploading'), false);
        },
        success: function(cloudinaryResponse){
            Alloy.Globals.LO.hide();
            Ti.API.debug('success cloudinaryResponse: ', JSON.stringify(cloudinaryResponse));

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

var manageDevolution = function(){
    alert(L('devolution'));
};

$.listView.addEventListener('itemclick', function(evt) {
    var item = evt.section.getItemAt(evt.itemIndex);
    var bindId = evt.bindId;
    var section = evt.section;
    var itemIndex = evt.itemIndex;
    console.error('Tab in: ', item.raw_data);

    if (item.raw_data.state !== 'entregada') {
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
                        state: item.raw_data.state,
                        callback: function(response){
                            if (response === true) {
                                item.raw_data.state = 'entregada'
                            }
                            item.order_state.backgroundColor = getStateColor(item.raw_data.state);
                            section.updateItemAt(itemIndex, item);
                       }
                    });
                } else if(evt.index === 1) {
                    manageDevolution();
                }
            }
        });
    } else {
        managePhoto({
            order_id: item.raw_data.id,
            internal_guide: item.raw_data.internal_guide,
            state: item.raw_data.state,
            callback: function(response){
                if (response === true) {
                    item.raw_data.state = 'entregada'
                }
                item.order_state.backgroundColor = getStateColor(item.raw_data.state);
                section.updateItemAt(itemIndex, item);
            }
        });
    }
});
