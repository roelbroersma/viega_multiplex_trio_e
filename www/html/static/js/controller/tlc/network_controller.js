tlcApp.controller('NetworkController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $modal, $location, $filter, loaderService) {

    var currentId = $stateParams["tlc_id"];
    var index = -1;

    var deleteSelectedFromArray = function () {
        _.each($scope.availableNetworks, function (data, idx) {
            if (_.isEqual(data, $scope.currentNetwork)) {
                index = idx;
                return;
            }
        });

        $scope.availableNetworks.splice(index, 1);

        $filter('orderObjectBy')($scope.availableNetworks, 'rawsignal');

        //$scope.availableNetworks.sort(mycomparator);
    };

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);

        //if ($scope.TLC.state == 'b') {
        //    $location.path(currentId + '/home');
        //}
        //else if ($scope.TLC.state == 'c') {
        //    $location.path(currentId + '/warm_up');
        //}
        //else if ($scope.TLC.state == 'f' || $scope.TLC.state == 'g' || $scope.TLC.state == 'e') {
        //    $location.path(currentId + '/hygiene');
        //}
        //else if ($scope.TLC.state == 'h') {
        //    $location.path(currentId + '/bathtub_fill');
        //}

        loaderService.addProcess('WLANS:LOAD');
        tlcService.getWlans().then(function (wlan) {
            $scope.availableNetworks = wlan;
            $scope.currentNetwork = $scope.TLC.wlan;
            $scope.macAdress = $scope.TLC.mac_address;

            loaderService.removeProcess('WLANS:LOAD');
        });

        window.setTimeout($rootScope.layoutContent, 1);
        //window.setTimeout($rootScope.layoutTiles, 1);

        loaderService.removeProcess('TLC:LOAD');
    });


    var selectNetwork = function (network) {

        if ($scope.currentNetwork != undefined) {
            $scope.availableNetworks.push($scope.currentNetwork);
        }
        $scope.currentNetwork = network;
        deleteSelectedFromArray();
    };


    function mycomparator(a, b) {
        return parseInt(b.rawsignal) - parseInt(a.rawsignal);
    }

    var ModalInstanceCtrl = function ($scope, $modalInstance, network) {
        $scope.network = network;

        window.setTimeout(function () {
            $('#password').focus();
        }, 1000);

        $scope.submit = function (network) {
            var password = $('#password').val();
            network.password = password;
            var globalSelectedNetwork = network;

            tlcService.connectWlan(network).then(function (response) {
                if (response.status === "CONNECTED") {
                    $modalInstance.dismiss("cancel");
                    selectNetwork(globalSelectedNetwork);
                    deleteSelectedFromArray();

                } else {
                    $scope.requestMessage = $translate.instant("WRONG_PASSWORD");
                }
            })

        };

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        };

    };

    var OtherModalInstanceCtrl = function ($scope, $modalInstance) {

        $scope.network = {};

        $scope.submit = function () {
            if ($scope.network.name != undefined) {
                var globalSelectedNetwork = $scope.network;
                tlcService.connectWlan($scope.network).then(function (response) {
                    if (response.status === "CONNECTED") {
                        $modalInstance.dismiss("cancel");
                        selectNetwork(globalSelectedNetwork);
                        deleteSelectedFromArray();

                    } else {
                        $scope.requestMessage = $translate.instant("WRONG_PASSWORD");
                    }
                });
            }
        };

        $scope.close = function () {
            $modalInstance.dismiss('cancel');
        };

    };


    $scope.switchNetwork = function (network) {

        var modalInstance = $modal.open({
            templateUrl: 'myModalContent.html',
            controller: ModalInstanceCtrl,
            size: '',
            resolve: {
                network: function () {
                    return network;
                }
            }
        });
    };

    $scope.connectToOther = function () {
        var modalInstance = $modal.open({
            templateUrl: 'myModalContent2.html',
            controller: OtherModalInstanceCtrl,
            size: '',
            resolve: {}
        });
    };


    $scope.disconnectWLAN = function () {
        tlcService.disconnectWLAN();

        $scope.currentNetwork = undefined;
        $scope.restarting = true;
    };

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });


});