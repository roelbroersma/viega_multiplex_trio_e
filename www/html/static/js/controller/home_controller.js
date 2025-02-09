tlcApp.controller('HomeController', function ($scope, $rootScope, tlcService, $location) {

    $(window).on("orientationchange", function () {
        window.location.reload();
    });


});