/* kproto core*/

(function ($) {
    var me = null;
    var k = function (name, config) {
        me = this;
        this.version = "2.0 mellon";
        this.name = name;
        this.config = $.extend({
            "js": "libs",
            "css": "css",
            "images": "images",
            "template": "tpl"
        }, config);
        this.bindEventListener();
    };
    /* functions */
    $.extend(window, {
        uppercase: function (s) {
            return (typeof s == "string") ? s.toUpperCase() : s;
        },
        lowercase: function (s) {
            return (typeof s == "string") ? s.toLowerCase() : s;
        },
        trim: function (s) {
            return (typeof s == "string") ? ltrim(rtirm(s)) : s;
        },
        ltrim: function (s) {
            return (typeof s == "string") ? s.replace(/^\s+/g, "") : s;
        },
        rtrim: function (s) {
            return (typeof s == "string") ? s.replace(/\s+$/g, "") : s;
        },
        strim: function (s) {
            return (typeof s == "function") ? trim(s.replace(/\s+/g, " ")) : s;
        },
        isNull: function (s) {
            return s === null || s == undefined || s == "" || s == NaN;
        },
        $fmt: function () {
            if (arguments.length === 0)
                return null;
            var s = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                s = str.replace(re, arguments[i]);
            }
            return s;
        }
    });
    /*  global it */
    window.kproto = k;

})(jQuery);
/* document timer module */
(function (k) {
    k.prototype.timer = {};
    /*  sleep function, hold it  when timing come, then do it
     @param name as string, name of module to sleep
     @param t as integer, sleeping time , unit ms;
     @param func as function, the callback function to do;
     */
    k.prototype.sleep = function (name, t, func) {
        if (!isNull(this.timer[name])) {
            this.weakup(name);
        }
        var me = this;
        var t = this.timer[name] = {
            "tramp": null,
            "func": func
        };
        t.tramp = window.setTimeout(function () {
            me.weakup(name);
        }, t);
    };
    /* weakup the name of sleep module,
     @param name as string, name of module to sleep
     */
    k.prototype.weakup = function (name) {
        if (!isNull(this.timer[name])) {
            window.clearTimeout(this.timer[name].tramp);
            var func = this.timer[name].func;
            if (typeof func === "function") {
                func.call();
            }
            delete this.timer[name];
        }
    };

    k.prototype.looping = function (name, t, func) {
        if (!isNull(this.timer[name])) {
            this.loop_exit(name);
        }
        var me = this;
        this.timer[name] = {
            "tramp": null,
            "func": func
        };
        var tt = this.timer[name];
        tt.tramp = window.setInterval(function () {
            tt.func.call()
        });
    };

    k.prototype.loop_exit = function (name) {
        if (!isNull(this.timer[name])) {
            window.clearInterval(this.timer[name].tramp);
            var func = this.timer[name].func;
            if (typeof func === "function") {
                func.call();
            }
            delete this.timer[name];
        }
    };

    k.prototype.loop_pause = function (name) {
        if (!isNull(this.timer[name])) {
            window.clearInterval(this.timer[name].tramp);
        }
    };

    k.prototype.loop_continue = function (name) {
        if (!isNull(this.timer[name])) {
            var t = this.timer[name];
            t.tramp = window.setInterval(function () {
                t.func.call();
            });
        }
    };
    
})(kproto);

/* kproto controller and document events module */
(function ($, k) {
    k.prototype.ctrls = {};
    k.prototype.sliceAction = function (e) {
        var el = e.target, ename = e.type, etag = "kp-" + ename;
        var pnode = (!isNull($(e.target).attr("kp-controller"))) ? $(e.target) : $(e.target).parents("*[kp-controller]").eq(0),
                enode = (!isNull($(e.target).attr(etag))) ? $(e.target) : $(e.target).parents(etag).eq(0),
                $scope = pnode.attr("kp-controller"),
                $func = enode.attr(etag);
        if (typeof this.ctrls[$scope] == "object" && typeof this.ctrls[$scope][$func] == "function") {
            this.ctrls[$scope][$func].call(el, ename, $scope);
        }
    };

    k.prototype.bindEventListener = function () {
        var ename = ["click", "tap", "dblclick", "dbltap", "swipe", "swipleft", "swipright", "swipeup", "swipedown", "split", "adduct", "taphold", "drag", "dragstart", "dragrelease", "hover", "hout", "focus", "blur"];
        var prefix = '*[kp-{0}]', el, nl = ename.length;
        var me = this;
        for (var i = 0; i < nl; i++) {
            el = prefix.replace("{0}", ename[i]);
            $(el).on(ename[i], function (e) {
                me.sliceAction(e);
            });
        }
    };

    k.prototype.controller = function (name, o) {
        this.ctrls[name] = $.extend({}, o);
    };

    k.prototype.removeController = function (name) {
        delete this.ctrls[name];
    };

})(jQuery, kproto);

/* kproto route
 * sameple code: 
 * 
 app.route(function ($route) {
 $route.when("#page0", {templateUrl: 'tpl/page0.html', controller: 'ac', target: '#container', method: 'update'});
 $route.when("#page1", {templateUrl: 'tpl/page1.html', controller: 'ac', target: '#container', method: 'insert'});
 $route.otherwise("error404.html");
 }); 
 
 * */

(function ($, k) {

    k.prototype.route = function (handler) {
        return  new kpRoute(handler);
    };

    function kpRoute(handler) {
        /*
         *  hash for routes list as json; key is the path; like is:
         {"#page0": {templateUrl: 'tpl/page0.html', controller: 'ac', target: '#container', method: 'update' }, ...  }         
         when window.navigator has changed, it will be fireEvent "hashChanged", and check hash to request and render;
         */
        this.hash = {};
        var me = this;

        this.when = function (path, route) {
            var t = {
                templateUrl: null,
                controller: null,
                target: null,
                method: 'update'
            };

            this.hash[path] = $.extend(t, route);
        };

        this.otherwise = function (params) {
            if (typeof params == "string") {
                params = {redirectTo: params};
            }
            this.when("_otherwise", params);
        };
        this.find = function (key) {
            return (typeof this.hash[key] == "undefined") ? this.hash._otherwise : this.hash[key];
        }
        this.compile = function (c) {
            //need to call template engin;
            return c;
        };
        this.render = function (content, obj, callback) {
            var o = {
                "append": function (s, c, f) {
                    $(c).appendTo(s);
                    if (typeof f == "function") {
                        f(s);
                    }
                },
                "update": function (s, c, f) {
                    $(s).html(c);
                    if (typeof f == "function") {
                        f(s);
                    }
                },
                "replace": function (s, c, f) {
                    var n = $(c);
                    $(s).replaceWith(n);
                    if (typeof f == "function") {
                        f(s);
                    }
                },
                "insert": function (s, c, f) {
                    var n = $(c);
                    $(s).insertBefore(n);
                    if (typeof f == "function") {
                        f(s);
                    }
                }
            };

            if (typeof o[obj.method] == "function") {
                o[obj.method](obj.target, content, callback);
            }
        };
        this.hashChanged = function (hash, callback) {
            var o = this.find(hash);
            if (typeof o == "undefined") {
                window.location.href = o.redirectTo;
            } else {
                $.get(o.templateUrl, function (data, status) {
                    if (status == "success") {
                        me.render(me.compile(data, o.controller), o, callback);
                    }
                });
            }
        };

        if ("onhashchange" in window) { // event supported?
            window.onhashchange = function () {
                me.hashChanged(window.location.hash);
            };
        } else { // event not supported:
            var storedHash = window.location.hash;
            window.setInterval(function () {
                if (window.location.hash != storedHash) {
                    storedHash = window.location.hash;
                    me.hashChanged(storedHash);
                }
            }, 100);
        }
        if (typeof handler == "function") {
            return handler(this);
        }
    }

})(jQuery, kproto);