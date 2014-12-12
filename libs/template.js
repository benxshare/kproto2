/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function ($, k) {
    var prefix = "kp-";
    var attrbutes = ["replace", "include", "append", "repeat", "for", "switch", "case", "if", "bind", "interval", "timeout", "delay", "component", "data-bind", "controller", "app"];


    function compile(content) {
        var html = content;
        
        //parse include;
        $(content).find("*[kp-include],*[kp-replace],*[kp-append]").each(function(index, item){
            var t = $(item);
            var url = $(item).attr("kp-include");
            $get(url, t, "include");
        });
        
        return html;
    }


    render = function (c, t, m, f) {
        var o = {
            "append": function (t, c, f) {
                $(c).appendTo(t);
                if (typeof f == "function") {
                    f(t);
                }
            },
            "include": function (t, c, f) {
                $(t).html(c);
                if (typeof f == "function") {
                    f(t);
                }
            },
            "replace": function (t, c, f) {
                var n = $(c);
                $(t).replaceWith(n);
                if (typeof f == "function") {
                    f(t);
                }
            }
        };

        if (typeof o[m] == "function") {
            o[m](t, c, f);
        }
    };

    $get = function (url, target, method, func) {
        $.get(url, function (data, status) {
            if (status == "success") {
                render(compile(data), target, method, func);
            }
        });
    };

})(jQuery, kproto)

