(function() {
    var keys = [];

    keys.push({name: "camera", code: 0xfe60f});

    keys.forEach(function(icon) {
        exports[icon.name] = String.fromCharCode(icon.code);
    });
})();