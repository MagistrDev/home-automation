/*** Z-Way DevicesCollection class ************************************

 Version: 1.0.0
 -------------------------------------------------------------------------------
 Author: Stanislav Morozov <morozov@z-wave.me>
 Copyright: (c) ZWave.Me, 2014

 ******************************************************************************/

DevicesCollection = function (controller) {
    var that = this;
    that.controller = controller;
    that.config = {};
    that.models = [];
    that.statusReady = false;
    that.db = {
        cid: {},
        id: {},
        indexes: {},
        hardwareId: {}
    };
    that.length = 0;
    that.on('ready', function () {
        that.statusReady = true;
    });
    that.initialize.apply(this, arguments);
};

inherits(DevicesCollection, EventEmitter2);

_.extend(DevicesCollection.prototype, {
    initialize: function () {
        'use strict';
        _.bindAll(this, 'updateLength', 'create');
        // Load exact device classes
        var path = 'classes/devices/';

        fs.list(path).forEach(function (deviceCLassName) {
            executeFile(path + deviceCLassName);
        });
    },
    updateLength: function () {
        this.length = _.size(this.models);
    },
    create: function (deviceId, deviceType, handler) {
        var that = this,
            vDev = null;

        console.log("Creating device " + deviceType + " id = " + deviceId);
        if ("switchBinary" === deviceType) {
            vDev = new ZWaveSwitchBinaryDevice(deviceId, that.controller, handler);
        } else if ("switchMultilevel" === deviceType) {
            vDev = new ZWaveSwitchMultilevelDevice(deviceId, that.controller, handler);
        } else if ("sensor" === deviceType) {
            vDev = new ZWaveSensorBinaryDevice(deviceId, that.controller, handler);
        } else if ("probe" === deviceType) {
            vDev = new ZWaveSensorMultilevelDevice(deviceId, that.controller, handler);
        } else if ("battery" === deviceType) {
            vDev = new ZWaveBatteryDevice(deviceId, that.controller, handler);
        } else if ("door" === deviceType) {
            vDev = new ZWaveDoorlockDevice(deviceId, that.controller, handler);
        } else if ("fan" === deviceType) {
            vDev = new ZWaveFanModeDevice(deviceId, that.controller, handler);
        } else if ("thermostat" === deviceType) {
            vDev = new ZWaveThermostatDevice(deviceId, that.controller, handler);
        }

        if (vDev !== null) {
            vDev.init();
            that.add(vDev);
            that.updateLength();
        } else {
            console.log("Error creating device");
        }

        return vDev;
    },
    add: function (model) {
        if (model.hasOwnProperty('cid')) {
            if (this.db.cid[model.cid] === model) {
                delete this.db.cid[model.cid];
            }
            delete model.cid;
        }

        model.cid = _.uniqueId('c');
        this.db.cid[model.cid] = model;
        this.db.id[model.get('id')] = model;
        // add to collection
        this.models.push(model);
        model.index = this.models.indexOf(model);
        this.db.indexes[model.index] = model;
    },
    get: function (identificator) {
        var result;
        if (this.db.id.hasOwnProperty(identificator)) {
            result = this.db.id[identificator];
        } else if (this.db.cid.hasOwnProperty(identificator)) {
            result = this.db.cid[identificator];
        }
        return result;
    },
    first: function () {
        return _.first(this.models);
    },
    last: function () {
        return _.last(this.models);
    },
    size: function () {
        return _.size(this.models);
    },
    toJSON: function (options) {
        var models;
        if (!this.statusReady) {
            models = [];
        } else {
            models = this.models.map(function (model) {
                return model.toJSON();
            });

            options = options || {};

            if (options.since) {
                models = models.filter(function (device) {
                    return device.updateTime >= options.since;
                });
            }
        }

        return models;
    },
    remove: function (identificator) {
        var that = this,
            model = that.get(identificator);

        if (!model) {
            return;
        }

        that.models = that.models.filter(function (object) {
            return object.cid !== model.cid;
        });

        if (that.db.id.hasOwnProperty(identificator)) {
            delete that.db.id[identificator];
        } else if (that.db.cid.hasOwnProperty(identificator)) {
            delete that.db.cid[identificator];
        } else if (that.db.indexes.hasOwnProperty(model.index)) {
            delete that.db.indexes[model.index];
        }

        delete model.cid;

        // events
        that.collection.emit('remove', model);
        that.collection.emit('all', model);

        return model;
    }
});

/*
advances method:
add
remove
get
reset
destroy
set
at - index
pop
sync
where
findWhere
clone
trigger
on
off
 */