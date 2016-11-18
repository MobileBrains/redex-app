(function() {
    var keys = [];

    keys.push({name: 'camera',   code: 0xfe60f});
    keys.push({name: 'user',     code: 0xfe670});
    keys.push({name: 'password', code: 0xfe687});

    keys.forEach(function(icon) {
        exports[icon.name] = String.fromCharCode(icon.code);
    });
})();