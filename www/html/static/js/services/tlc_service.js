tlcApp.factory('tlcService', function ($http, $rootScope, $q) {

    return ({
        getTLCs: getTLCs,
        getTLC: getTLC,
        saveTLC: saveTLC,
        getTLCSettings: getTLCSettings,
        saveTLCSettings: saveTLCSettings,
        savePassword: savePassword,
        getTLCState: getTLCState,
        startWarmUp: startWarmUp,
        getWarmUpState: getWarmUpState,
        startMeassureingCup: startMeassureingCup,
        getMeassureingCupState: getMeassureingCupState,
        getMeassureingCupValue: getMeassureingCupValue,
        saveMeassureingCupValue: saveMeassureingCupValue,
        startBathtubFill: startBathtubFill,
        getBathtubState: getBathtubState,
        getHygieneDetail: getHygieneDetail,
        setHygieneDetail: setHygieneDetail,
        startDesinfection: startDesinfection,
        cancelDesinfection: cancelDesinfection,
        functionTestStep0: functionTestStep0,
        functionTestStep1: functionTestStep1,
        functionTestStep2: functionTestStep2,
        functionTestStep3: functionTestStep3,
        getWlans: getWlans,
        getPopUpState: getPopUpState,
        savePopUpState: savePopUpState,
        connectWlan: connectWlan,
        disconnectWLAN: disconnectWlan,
        getQuickTemp: getQuickTemp,
        sendQuickTemp: sendQuickTemp,
        requestForUpdate: requestForUpdate
    });

    function getTLCs() {
        return $rootScope.request("tlc/", "GET", null);
    }

    function getTLC(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/", "GET", null, TLCid);
    }

    function saveTLC(TLC) {
        return $rootScope.request("tlc/" + TLC.id + "/", "POST", TLC, TLC.id);
    }

    function getPopUpState(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/popup/", "GET", null, TLCid);
    }

    function savePopUpState(TLCid, popUpState) {
        return $rootScope.request("tlc/" + TLCid + "/popup/", "POST", popUpState, TLCid);
    }

    function getTLCSettings(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/settings/", "GET", null, TLCid);
    }

    function saveTLCSettings(TLC) {
        return $rootScope.request("tlc/" + TLC.id + "/settings/", "POST", TLC, TLC.id);
    }

    function savePassword(id, login) {
        return $rootScope.request("tlc/" + id + "/set-password/", "POST", login, id);
    }

    function getTLCState(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/state/", "GET", null, TLCid);
    }

    function startWarmUp(TLCid, temp) {
        return $rootScope.request("tlc/" + TLCid + "/warmup/", "POST", temp, TLCid);
    }

    function getWarmUpState(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/warmup/", "GET", null, TLCid);
    }

    function startMeassureingCup(TLCid, amount) {
        return $rootScope.request("tlc/" + TLCid + "/measuring-cup/", "POST", amount, TLCid);
    }

    function getMeassureingCupState(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/measuring-cup/", "GET", null, TLCid);
    }

    function getMeassureingCupValue(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/measuring-cup/save/", "GET", null, TLCid);
    }

    function saveMeassureingCupValue(TLCid, amount) {
        return $rootScope.request("tlc/" + TLCid + "/measuring-cup/save/", "POST", amount, TLCid);
    }

    function startBathtubFill(TLCid, object) {
        return $rootScope.request("tlc/" + TLCid + "/bathtub-fill/", "POST", object, TLCid);
    }

    function getBathtubState(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/bathtub-fill/", "GET", null, TLCid);
    }

    function getHygieneDetail(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/hygiene/", "GET", null, TLCid);
    }

    function setHygieneDetail(hygieneDetail) {
        if (hygieneDetail.hygiene_flush_active) {
            hygieneDetail.hygiene_flush_active = 'true';
        } else {
            hygieneDetail.hygiene_flush_active = 'false';
        }
        return $rootScope.request("tlc/" + hygieneDetail.id + "/hygiene/", "POST", hygieneDetail, hygieneDetail.id);
    }

    function startDesinfection(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/hygiene/thermal-desinfection/start/", "POST", [TLCid], TLCid);
    }

    function cancelDesinfection(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/hygiene/thermal-desinfection/cancel/", "POST", TLCid, TLCid);
    }

    function functionTestStep0(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/functional-test/step/0/", "POST", TLCid, TLCid);
    }


    function functionTestStep1(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/functional-test/step/1/", "POST", TLCid, TLCid);
    }

    function functionTestStep2(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/functional-test/step/2/", "POST", TLCid, TLCid);
    }

    function functionTestStep3(TLCid) {
        return $rootScope.request("tlc/" + TLCid + "/functional-test/step/3/", "POST", TLCid, TLCid);
    }

    function getWlans() {
        return $rootScope.request("wlan/", "GET", null);
    }

    function connectWlan(wlanData) {
        return $rootScope.request("wlan/connect/", "POST", wlanData);
    }

    function disconnectWlan() {
        return $rootScope.request("wlan/disconnect/", "POST", null);
    }

    function getQuickTemp(id, access) {
        return $rootScope.request("tlc/" + id + "/quick/" + access + "/", "GET", null, id);
    }

    function sendQuickTemp(id, access) {
        var data = {'data': 1};

        return $rootScope.request("tlc/" + id + "/quick/" + access + "/", "POST", data, id);
    }

    function requestForUpdate(updateObject) {
        return $rootScope.request('automatic-update/', "POST", updateObject);
    }


});