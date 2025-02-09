tlcApp.controller('SettingsController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $http, $timeout, loaderService) {

    var currentId = $stateParams["tlc_id"];
    $scope.minimalTemp = 4;
    $scope.maximalTemp = 80;
    $scope.minimalAmount = 10; // liter
    $scope.maximalAmount = 1000; // liter
    $scope.currentMaxFillAmount = 0;
    $scope.currentMaxFillAmountValid = true;

    // Load TLC data
    loadTlcData();

    $scope.setTempUnit = function (unit) {
        if (unit == 0) {
            $scope.tempCurrency = '°C';
        }
        else {
            $scope.tempCurrency = '°F';
        }

        $scope.tempConversionType = $scope.settings.temperature_unit = unit;

        if ($scope.tempConversionType == 0) {
            $scope.tempCurrency = '°C';

            $scope.minimalTemp = 4;
            $scope.maximalTemp = 80;
            $scope.maxTemp = Math.round($scope.settings.max_temp);
            $('#maxTemp').val($scope.maxTemp);
        }
        else {
            $scope.tempCurrency = '°F';

            $scope.minimalTemp = 4 * 1.8 + 32;
            $scope.maximalTemp = 80 * 1.8 + 32;
            $scope.maxTemp = Math.round($scope.settings.max_temp * 1.8 + 32);
            $('#maxTemp').val($scope.maxTemp);
        }

        saveSettings();
    };

    $scope.getAmbientColor = function (ambientKey) {
        switch (ambientKey) {
            case 0:
                //grau
                return '#848484';
            case 1:
                //cyan
                return '#00DDFF';
            case 2:
                //blau
                return '#0059A1';
            case 3:
                //magenta
                return '#ff0090';
            case 4:
                //rot
                return '#E30514';
            case 5:
                //orange
                return '#ED6E03';
            case 6:
                //gelb
                return '#FEF000';
            case 7:
                //grün
                return '#3BA534';
            case 8:
                //weiss
                return '#FFFFFF';
            case 9:
                //ambient
                return '#646464';
        }
    };

    $scope.getAmbientKey = function (ambientKey) {
        switch (ambientKey) {
            case 0:
                return 'BLACK';
            case 1:
                return 'LIGHT_BLUE';
            case 2:
                return 'BLUE';
            case 3:
                return 'PINK';
            case 4:
                return 'RED';
            case 5:
                return 'ORANGE';
            case 6:
                return 'YELLOW';
            case 7:
                return 'GREEN';
            case 8:
                return 'WHITE';
            case 9:
                return 'AMBIENT_LIGHT';
        }
    };

    var ambientTrans;

    /*
     * Set ambient color
     *
     * @param {Number} ambient The ambient id,  0 - 9
     * @param {Boolean} updateSettings Optional flag to update settings remotely. Default: true
     */
    $scope.setAmbientColor = function (ambient, updateSettings) {

        updateSettings = typeof updateSettings !== 'boolean' ? true : updateSettings;
        $scope.settings.ambient_light = ambient;

        // Store new ambient color remote
        if (updateSettings) {
            saveSettings();
        }

        if (ambient != 9) {
            var ambientColor = $scope.getAmbientColor(ambient);

            ambientTrans = $scope.getAmbientKey(ambient);

            $scope.ambientName = ambientTrans;

            $('.ambient-light-tile').css({
                'background': ambientColor
            });

            if (ambientColor == '#848484' ||
                ambientColor == '#0059A1' ||
                ambientColor == '#E30514' ||
                ambientColor == '#ff0090') {
                $('.ambient-light-tile button').css({
                    'color': '#FFFFFF'
                });
            }
            else {
                $('.ambient-light-tile button').css({
                    'color': '#000000'
                });
            }
        }
        else {
            ambientTrans = $scope.getAmbientKey(ambient);
            $scope.ambientName = ambientTrans;

            $('.ambient-light-tile').css({
                'background': $('#ambient_light').css('background')
            });
        }

    };
    var ambientColor = $scope.getAmbientColor($scope.currentAmbient);

    $scope.restartDevice = function () {
        tlcService.functionTestStep0($scope.TLC.id);
    };

    $('.tile').on("click", function () {
        if ($scope.status.isopen === true) {
            $scope.status.isopen = false;
        }
    });

    $('#maxTemp').on('change', function () {
        if ($(this).val() >= $scope.minimalTemp && $(this).val() <= $scope.maximalTemp) {
            if ($scope.tempConversionType == 0) {
                $scope.settings.max_temp = $(this).val();
            }
            else {
                $scope.settings.max_temp = ($(this).val() - 32) / 1.8;
            }

            saveSettings();

            $(this).css({
                'border-color': ''
            });
        }
        else {
            $(this).css({
                'border-color': 'red'
            });
        }
    });

    $('#maxRuntime').on('change', function () {
        if ($(this).val() >= 1 && $(this).val() <= 99) {
            $scope.maxRuntime = $scope.settings.max_flow_time = $(this).val();
            saveSettings();

            $(this).css({
                'border-color': ''
            });
        }
        else {
            $(this).css({
                'border-color': 'red'
            });
        }
    });


    $('.ambient-light-tile').css({
        'background-color': ambientColor
    });

    if ((ambientColor == '#848484' ||
        ambientColor == '#0059A1' ||
        ambientColor == '#E30514' ||
        ambientColor == '#ff0090')) {
        $('.ambient-light-tile button').css({
            'color': '#FFFFFF'
        });
    }
    else {
        $('.ambient-light-tile button').css({
            'color': '#000000'
        });
    }

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    $('.number-input input').on("keyup", function (evt) {
        if (evt.which == 13) {
            $(this).blur();
        }
    });

    $('.tile').on("scroll", function () {
        $('input').toggleClass('force-redraw');
    });

    $scope.languages = [];
    $scope.user_language = null;

    $scope.setUserLanguageLabel = function () {
        $.each($scope.languages, function (i, language) {
            if (language.key === $translate.use()) {
                $scope.user_language = language.name;
            }
        });
    };

    $scope.setLanguage = function (language, $event) {
        unsetLanguageFont($translate);
        $translate.use(language);
        setLanguageFont($translate);
        $.cookie("language", $translate.use(), {'expires': 900});
        $scope.setUserLanguageLabel();
    };

    $http({
        method: 'GET',
        url: $rootScope.routePrefix + 'data/languages.json?v=201810161010'
    }).success(function (data, status) {
        $scope.languages = data;
        $scope.setUserLanguageLabel();
    });

    /**
     * Debounce helper function
     *
     * @param {Function} callback
     * @param {Number} time The time delay in miliseconds, optional, default: 300
     * @return {Function}
     */
    function debounce (callback, time) {

        var timeout = null;
        time = typeof time === 'number' ? time : 300;

        return function () {

            $timeout.cancel(timeout);
            var allArguments = arguments;

            timeout = $timeout(function () {
                callback.apply(this, allArguments);
            }, time);
        };
    }

    /**
     * SaveTlcName
     *
     * @fires broadcast#tlcUpdated
     */
    function saveTlcName () {

        var tlcData = {
            "id": parseInt($scope.TLC.id),
            "name": he.encode($scope.TLC.name),
            "temperature": $scope.TLC.temperature,
            "flow": $scope.TLC.flow,
            "changed": 3
        };

        // Save name and broadcast a change event
        tlcService.saveTLC(tlcData).then(function () {
            $rootScope.$broadcast('tlcUpdated', tlcData);
        });
    }

    /**
     * Save TLC settings
     */
    function saveSettings () {
        tlcService.saveTLCSettings($scope.settings);
    };

    /**
     * Load TLC data
     */
    function loadTlcData () {
        loaderService.addProcess('TLC:LOAD');
        tlcService.getTLC(currentId)
            .catch((function () {
                loaderService.removeProcess('TLC:LOAD');
                // @todo: Handle error
            }))
            .then(function (TLC) {
                $scope.TLC = $rootScope.getTLCFromResponse(TLC);

                $scope.TLC.name = he.decode($scope.TLC.name);
                $scope.tlcNameInput = $scope.TLC.name;

                window.setTimeout($rootScope.layoutContent, 1);
                window.setTimeout($rootScope.layoutTiles, 1);

                // Call depending actions after tlc data is loaded
                onTlcDataLoaded();

                loaderService.removeProcess('TLC:LOAD');
            });
    }

    /**
     * Load TLC settings
     */
    function loadTlcSettings () {

        // Add process - to lock gui
        loaderService.addProcess('TLC:SETTINGS:LOAD');

        tlcService.getTLCSettings(currentId)
            .catch(function () {
                loaderService.removeProcess('TLC:SETTINGS:LOAD');
                // @todo: Handle error
            })
            .then(function (settings) {
                $scope.settings = $rootScope.getSingleElementFromResponse(settings);

                $scope.currentAmbient = $scope.settings.ambient_light;
                $scope.setAmbientColor($scope.settings.ambient_light, false);

                $scope.tempConversionType = $scope.settings.temperature_unit;

                if ($scope.tempConversionType == 0) {
                    $scope.tempCurrency = '°C';

                    $scope.minimalTemp = 4;
                    $scope.maximalTemp = 80;
                    $scope.maxTemp = $scope.settings.max_temp;
                }
                else {
                    $scope.tempCurrency = '°F';

                    $scope.minimalTemp = 4 * 1.8 + 32;
                    $scope.maximalTemp = 80 * 1.8 + 32;
                    $scope.maxTemp = $scope.settings.max_temp * 1.8 + 32;
                }

                $scope.maxRuntime = $scope.settings.max_flow_time;
                $scope.currentMaxFillAmount = parseInt($scope.settings.max_amount, 10) / 10; // dl to liter


                // Call depending actions after tlc settings are loaded
                onTlcSettingsLoaded();

                // Remove process
                loaderService.removeProcess('TLC:SETTINGS:LOAD');
            });
    }

    /**
     * Called after TLC data is loaded
     */
    function onTlcDataLoaded () {

        // Watch for changes in TLC name
        $scope.$watch('TLC.name', debounce((function (value, lastValue) {

            // Abort if not changed
            if (value === lastValue) {
                return;
            }

            // Update name remotely
            saveTlcName();
        })));

        // Load TLC settings
        loadTlcSettings();
    };

    /**
     * Called after TLC settings are loaded
     */
    function onTlcSettingsLoaded () {

        // Watch for changes of max amount input field
        $scope.$watch('currentMaxFillAmount', debounce(function (value, lastValue) {

            // Abort if no changes
            if (value === lastValue) {
                return;
            }

            // Cast max amount as integer
            var maxAmount = parseInt(value) || 0;

            // If max/min amount is respected
            if (maxAmount >= $scope.minimalAmount && maxAmount <= $scope.maximalAmount) {
                $scope.currentMaxFillAmountValid = true;
                $scope.settings.max_amount = maxAmount * 10;
                saveSettings();
            }
            else {
                $scope.currentMaxFillAmountValid = false;
            }
        }));
    }
});