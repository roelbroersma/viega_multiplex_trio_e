$(document).ready(function () {
    var mode = null;


    var getMode = function () {
        return $(window).width() < 768 ? 'small' : 'default';
    };

    var layoutNav = function () {
        var navWidth = $('.sub-nav').width();

        $('.sub-nav').css({
            'left': "-" + navWidth + "px"
        });

    };

    if ($(window).width() < 768) {
        setTimeout(layoutNav, 50);

    }

    $(window).on('resize', function ($state) {
        var new_mode = getMode();
        if (mode != new_mode) {
            window.location.reload();
        }
        if ($(window).width() < 768) {
            layoutNav();
        }
        else if ($(window).width() < 768) {
            $(".tile").css({
                'height': '100%'
            });
        }
    });

    //$(window).on('orientationchange', function (e) {
    //    window.location.reload();
    //});

    mode = getMode();

});


function getColorArray(temperature) {
    var mappings = [
        {
            temp: 4,
            r: 0,
            g: 0,
            b: 255
        },
        {
            temp: 6,
            r: 0,
            g: 0,
            b: 255
        },
        {
            temp: 8,
            r: 0,
            g: 0,
            b: 255
        },
        {
            temp: 10,
            r: 0,
            g: 17,
            b: 255
        },
        {
            temp: 12,
            r: 51,
            g: 34,
            b: 255
        },
        {
            temp: 14,
            r: 68,
            g: 34,
            b: 255
        },
        {
            temp: 16,
            r: 68,
            g: 51,
            b: 255
        },
        {
            temp: 18,
            r: 102,
            g: 51,
            b: 255
        },
        {
            temp: 20,
            r: 136,
            g: 85,
            b: 255
        },
        {
            temp: 22,
            r: 221,
            g: 119,
            b: 255
        },
        {
            temp: 24,
            r: 255,
            g: 187,
            b: 255
        },
        {
            temp: 26,
            r: 255,
            g: 221,
            b: 204
        },
        {
            temp: 28,
            r: 255,
            g: 204,
            b: 85
        },
        {
            temp: 30,
            r: 255,
            g: 187,
            b: 34
        },
        {
            temp: 32,
            r: 255,
            g: 187,
            b: 0
        },
        {
            temp: 34,
            r: 255,
            g: 153,
            b: 0
        },
        {
            temp: 36,
            r: 255,
            g: 136,
            b: 0
        },
        {
            temp: 38,
            r: 255,
            g: 119,
            b: 0
        },
        {
            temp: 40,
            r: 255,
            g: 102,
            b: 0
        },
        {
            temp: 42,
            r: 255,
            g: 85,
            b: 0
        },
        {
            temp: 44,
            r: 255,
            g: 68,
            b: 0
        },
        {
            temp: 46,
            r: 255,
            g: 51,
            b: 0
        },
        {
            temp: 48,
            r: 255,
            g: 34,
            b: 0
        },
        {
            temp: 50,
            r: 255,
            g: 17,
            b: 0
        },
        {
            temp: 52,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 54,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 56,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 58,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 60,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 62,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 64,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 66,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 68,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 70,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 72,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 74,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 76,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 78,
            r: 255,
            g: 0,
            b: 0
        },
        {
            temp: 80,
            r: 255,
            g: 0,
            b: 0
        }
    ];

    var rgb = {
        r: 0,
        g: 0,
        b: 0
    };

    if (temperature < 4) {
        rgb = mappings[0];
    }
    else if (temperature >= 80) {
        rgb = mappings[mappings.length - 1];
    }
    else {
        var indexLow = Math.floor((temperature - 4) / 2);
        var step = (temperature - 4) / 2 - indexLow;

        rgb.r = Math.round((1 - step) * (mappings[indexLow].r) + (step * (mappings[indexLow + 1].r)));
        rgb.g = Math.round((1 - step) * (mappings[indexLow].g) + (step * (mappings[indexLow + 1].g)));
        rgb.b = Math.round((1 - step) * (mappings[indexLow].b) + (step * (mappings[indexLow + 1].b)));
    }

    return rgb;
}

function getHexColorFromColor(color) {
    var red = color.r.toString(16);
    if (red.length === 1) {
        red = "0" + red;
    }

    var green = color.g.toString(16);
    if (green.length === 1) {
        green = "0" + green;
    }

    var blue = color.b.toString(16);
    if (blue.length === 1) {
        blue = "0" + blue;
    }

    return "#" + red + green + blue;
}

// from http://stackoverflow.com/questions/17910192/undefined-or-null-for-angularjs
/**
 * A convenience method for detecting a legitimate non-null value.
 * Returns false for null/undefined/NaN/Infinity, true for other values,
 * including 0/false/''
 * @method isValue
 * @static
 * @param o The item to test.
 * @return {boolean} true if it is not null/undefined/NaN || false.
 */
angular.isValue = function (val) {
    return !(val === null || !angular.isDefined(val) || (angular.isNumber(val) && !isFinite(val)));
};

/**
 * @see https://davidwalsh.name/query-string-javascript
 */
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function getActiveLanguage(languageCode, availableLanguages, defaultLanguage) {
    var userLang = angular.isDefined(languageCode) ? languageCode.toLowerCase() : "", altUserLang = null, manualLang = getUrlParameter('l');
    if (userLang.length !== 2) {
        altUserLang = userLang.slice(0, 2);
    }
    if (manualLang !== '') {
        userLang = manualLang;
    }

    if ($.inArray(userLang, availableLanguages) !== -1) {
        return userLang;
    } else if ($.inArray(altUserLang, availableLanguages) !== -1) {
        return altUserLang;
    } else {
        return defaultLanguage;
    }
}

function unsetLanguageFont($translate) {
    if (angular.isDefined($translate.use())) {
        $('body').removeClass('lang-' + $translate.use());
    }
}

function setLanguageFont($translate) {
    $('body').addClass('lang-' + $translate.use());
}

/**
 * Calculate width of text and replace as less characters as possible from the middle.
 * @param str
 * @param fontFamily
 * @param fontSize
 * @param fontWeight
 * @param maxWidth
 * @returns {*}
 */
function autoEllipsis(str, fontFamily, fontSize, fontWeight, maxWidth) {
    if (str === undefined) {
        return str;
    }
    var e, minCharNum = 4, shortStr, minCharsKept = 1;
    str = he.decode(str);
    if (str.length >= minCharNum) {
        if ($('#ellipsis-box').length === 0) {
            // append once
            $('body').append('<div id="ellipsis-box"></div>');
        }
        // update contents
        e = $('#ellipsis-box');
        e.css('font-family', fontFamily);
        e.css('font-size', fontSize);
        e.css('font-weight', fontWeight);
        e.text(str);
        if (e.prop('clientWidth') < maxWidth) {
            // text already fits, no action needed
            return str;
        }
        for (var i = Math.floor((str.length - 3) / 2); i >= minCharsKept; i = i - 1) {
            shortStr = str.substr(0, i) + '...' + str.substr(str.length - i, str.length);
            e.text(shortStr);
            if (e.prop('clientWidth') < maxWidth) {
                return shortStr;
            }
        }
    } else {
        return str;
    }
}
