tlcApp.controller('InfoController', function ($scope, $rootScope, tlcService, $stateParams, $translate, $location, Upload, $modal, loaderService) {

    var currentId = $stateParams["tlc_id"];
    $scope.showUploadForm = false;
    $scope.progressPercentage = 0;
    $scope.updateComplete = false;
    var modalInstance;
    var updateVerifyModalInstance

    loaderService.addProcess('TLC:LOAD');
    tlcService.getTLC(currentId).then(function (TLC) {
        $scope.TLC = $rootScope.getTLCFromResponse(TLC);
        $scope.softwareVersion = $scope.TLC.version;

        window.setTimeout($rootScope.layoutContent, 1);
        window.setTimeout($rootScope.layoutTiles, 1);

        if ($rootScope.isVersionOutdated($scope.softwareVersion, $scope.TLC.version_number_downloaded)) {
            $scope.updateAvailable = true;
            $scope.currentBasestationVersion = $scope.TLC.version_number_downloaded;
        }

        loaderService.removeProcess('TLC:LOAD');
    });

    window.setTimeout($rootScope.layoutContent, 1);

    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
        $scope.isIOS = true;
    }

    $('.nav-open a').on("click", function () {
        $rootScope.navSlideOut();
    });

    $scope.uploadFile = function (room) {
        var file = $scope.myFile;

        if (file == undefined) {
            $('.errors', '#settings-verions').empty().append($translate.instant('FILE_REQUIRED')).show();
        }
        else {
            Upload.upload({
                url: window.location.protocol + "//" + window.location.host + '/api/update-file-upload/',
                file: file
            }).progress(function (evt) {
                $scope.updateSetup = true;
            }).success(function (data, status, headers, config) {
                var response = data;
                $scope.updateSetup = false;
                $scope.updateRunning = true;
                // console.log("The update response should be there now");
                // console.log(response);
                // console.log(response.duration);
                // console.log(response.status);

                if (response.status == 200) {
                    $rootScope.percentage = 0;

                    // 1% of the time in miliseconds
                    var time = response.duration * 10;

                    $rootScope.overwriteProgressWidth = false;
                    window.setInterval(function () {
                        if ($rootScope.percentage < 100) {
                            $rootScope.percentage++;
                            $rootScope.$apply();
                        }
                        else {
                            $rootScope.percentage = 100;
                            $scope.updateRunning = false;
                            $rootScope.updateFinished = true;
                            $rootScope.$apply();
                        }

                        $scope.progress = {'width': $rootScope.percentage + '%'};
                        

                        if ($("#upload-progress").css("width") == "0px") {
                            $rootScope.overwriteProgressWidth = true;
                        }
                        if ($rootScope.overwriteProgressWidth) {
                            // manually update for IE11
                            $("#upload-progress").css("width", $rootScope.percentage + "%");
                        }
                    }, time);
                }

            });
        }
    };

    $(document).on('change', '.btn-file :file', function () {
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        input.trigger('fileselect', [numFiles, label]);
    });

    $(document).ready(function () {
        $('.btn-file :file').on('fileselect', function (event, numFiles, label) {

            var input = $(this).parents('.input-group').find(':text'),
                log = numFiles > 1 ? numFiles + ' files selected' : label;

            if (input.length) {
                input.val(log);
            } else {
                if (log) alert(log);
            }

        });
    });

    $scope.getResponse = function (response) {
        return response[0].data
    };


    $scope.automaticUpdate = function (basestation, url, checksum) {
        var updateObject = {};

        updateVerifyModalInstance = $modal.open({
            templateUrl: 'automaticUpdateVerify.html',
            controller: UpdateVerifyModalInstanceCtrl,
            size: ''
        });

        tlcService.requestForUpdate(updateObject).then(function (response) {
            updateVerifyModalInstance.close();

            modalInstance = $modal.open({
                templateUrl: 'automaticUpdateContent.html',
                controller: ModalInstanceCtrl,
                size: '',
                resolve: {
                    response: function () {
                        return $scope.getResponse(response);
                    }
                }
            });

        });
    };
});

var UpdateVerifyModalInstanceCtrl = function ($scope, $modalInstance) {

};

var ModalInstanceCtrl = function ($scope, $rootScope, $modalInstance, response) {


    if (response == undefined) {
        response = {
            'status': 200,
            'duration': 100
        };
    }

    $scope.confirm = function (room) {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };

    $modalInstance.opened.then(function () {
        $scope.status = response.status;
        if (response.status == 200) {
            $rootScope.percentage = 0;

            // 1% of the time in miliseconds
            var time = response.duration * 10;

            $rootScope.overwriteProgressWidth = false;
            window.setInterval(function () {
                if ($rootScope.percentage < 100) {
                    $rootScope.percentage++;
                    $rootScope.$apply();
                }
                else {
                    $rootScope.percentage = 100;
                    $rootScope.updateFinished = true;
                    $rootScope.$apply();
                }
                
                $scope.progress = { 'width' : $rootScope.percentage + '%' };


                if ($("#upload-progress").css("width") == "0px") {
                    $rootScope.overwriteProgressWidth = true;
                }
                if ($rootScope.overwriteProgressWidth) {
                    // manually update for IE11
                    $("#upload-progress").css("width", $rootScope.percentage + "%");
                }
            }, time);
        }
    });
};
